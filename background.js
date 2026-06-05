// background.js

const DB_NAME = "ColabRewindDB";
const STORE_NAME = "runs";
const MAX_RUNS_PER_CELL = 15;

// ==========================================
// 1. DATABASE INITIALIZATION
// ==========================================
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
                store.createIndex("tabId", "tabId", { unique: false });
                store.createIndex("cellId", "cellId", { unique: false });
                store.createIndex("timestamp", "timestamp", { unique: false });
                store.createIndex("isCheckpoint", "isCheckpoint", { unique: false });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

// ==========================================
// 2. CORE DATABASE OPERATIONS
// ==========================================
async function saveRun(notebookId, cellId, text, isCheckpoint = false) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        
        const record = {
            tabId: notebookId, //    We store the notebook URL inside the existing tabId column!
            cellId: cellId,
            text: text,
            timestamp: Date.now(),
            isCheckpoint: isCheckpoint,
            label: isCheckpoint ? null : ""
        };

        store.add(record);

        transaction.oncomplete = () => {
            resolve();
            enforceRollingBuffer(notebookId, cellId);
        };
        transaction.onerror = (event) => reject(event.target.error);
    });
}

// Helper function to safely open the DB and delete a specific run using a Cursor
function deleteRun(timestamp) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = (event) => reject("Failed to open database: " + event.target.error);

        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            const cursorRequest = store.openCursor();

            cursorRequest.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.timestamp === timestamp) {
                        const deleteReq = cursor.delete(); 
                        deleteReq.onsuccess = () => resolve();
                        return; 
                    }
                    cursor.continue(); 
                } else {
                    resolve(); 
                }
            };

            cursorRequest.onerror = () => reject(cursorRequest.error);
            tx.oncomplete = () => db.close();
        };
    });
}

async function enforceRollingBuffer(notebookId, cellId) {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("cellId");
        const request = index.getAll(cellId);

        request.onsuccess = () => {
            // Filter using notebookId
            let runs = request.result.filter(r => r.tabId === notebookId && !r.isCheckpoint);
            runs.sort((a, b) => a.timestamp - b.timestamp);

            if (runs.length > MAX_RUNS_PER_CELL) {
                const runsToDelete = runs.length - MAX_RUNS_PER_CELL;
                for (let i = 0; i < runsToDelete; i++) {
                    store.delete(runs[i].id);
                    console.log(`[ColabRewind] Deleted old run to maintain buffer.`);
                }
            }
            resolve();
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

// ==========================================
// 3. THE MESSAGE LISTENER
// ==========================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    if (message.action === 'SAVE_CELL_RUN') {
        const { notebookId, id, text, isCheckpoint } = message.data; 

        saveRun(notebookId, id, text, isCheckpoint)
            .then(() => sendResponse({ status: "success" }))
            .catch(err => sendResponse({ status: "error", error: err.toString() }));

        return true; 
    }
    
    else if (message.action === 'GET_CELL_HISTORY') {
        const { notebookId, id } = message.data;
        
        //  Calling getCellHistory 
        getCellHistory(notebookId, id)
            .then(data => sendResponse({ status: "success", data: data }))
            .catch(err => sendResponse({ status: "error", error: err.toString() }));
            
        return true;
    }

    else if (message.action === 'DELETE_RUN') {
        deleteRun(message.data.timestamp)
            .then(() => {
                console.log("[Colab Rewind] 🗑️ Run deleted successfully.");
                sendResponse({ success: true });
            })
            .catch((err) => {
                console.error("[Colab Rewind] Database deletion failed:", err);
                sendResponse({ success: false });
            });
            
        return true; 
    }
});

// ==========================================
// PHASE 3: DATABASE READ OPERATIONS
// ==========================================

async function getCellHistory(notebookId, cellId) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("cellId");
        const request = index.getAll(cellId);

        request.onsuccess = () => {
            //  Filter runs to ONLY include the current notebook's URL
            const runs = request.result.filter(r => r.tabId === notebookId);
            runs.sort((a, b) => b.timestamp - a.timestamp);
            resolve(runs);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}