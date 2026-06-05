// ==========================================
// COLAB REWIND - COMPLETE CONTENT.JS
// ==========================================


// Ask Chrome to lock our database and never auto-delete it
if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => {
        if (granted) {
            console.log("[Colab Rewind] 🛡️ Storage locked! Chrome will not auto-delete it.");
        }
    });
}

// --- 1. STYLES ---
const styles = `
    /* Main Rewind Button */
    .colab-rewind-btn {
        background: transparent !important; 
        border: 1px solid transparent !important;
        /* 🚨 THE FIX: Match the native text color so it flips to dark gray in Light Mode */
        // color: var(--colab-primary-text-color, #5f6368) !important; 
        color: var(--colab-icon-color, #5f6368) !important;
        cursor: pointer;
        font-size: 12px;
        font-family: Consolas, monospace;
        font-weight: bold;
        padding: 0px 8px;
        margin: 4px 8px 0px 0px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        height: 24px; 
        transition: all 0.2s ease-in-out;
        z-index: 9999;
    }
    .colab-rewind-btn:hover { 
        /* Use native hover gray instead of blue to perfectly match Colab's toolbar */
        background: var(--colab-highlighted-surface-color, rgba(0, 0, 0, 0.04)) !important; 
    }
    
    /* Dropdown Menu */
    .colab-rewind-dropdown {
        position: absolute; width: 300px; 
        background: var(--colab-primary-surface-color, #ffffff); 
        border: 1px solid var(--colab-border-color, #dadce0);
        border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;
        display: none; flex-direction: column; max-height: 400px; overflow-y: auto;
        font-family: -apple-system, sans-serif; text-align: left;
    }
    .colab-rewind-dropdown.show { display: flex; }
    
    /* Individual Run Rows */
    .rewind-item { 
        padding: 8px 12px; 
        border-bottom: 1px solid var(--colab-border-color, #f1f3f4); 
        cursor: pointer; font-size: 12px; 
        color: var(--colab-primary-text-color, #3c4043); 
    }
    .rewind-item:hover { 
        background: var(--colab-highlighted-surface-color, #f8f9fa); 
    }
    .rewind-empty { 
        padding: 16px; text-align: center; 
        color: var(--colab-secondary-text-color, #80868b); 
        font-size: 12px; 
    }
    
    /* Preview Overlay */
    .colab-rewind-preview-overlay {
        position: relative; margin: 8px 12px; 
        background: var(--colab-primary-surface-color, #ffffff); 
        z-index: 500;
        display: flex; flex-direction: column; 
        border: 2px solid var(--colab-call-to-action-color, #1a73e8);
        border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    }
    .preview-header {
        background: var(--colab-call-to-action-color, #1a73e8); 
        // color: var(--colab-primary-surface-color, #ffffff); 
        color: #ffffff !important; 
        padding: 8px 12px; font-size: 12px;
        display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; font-weight: 500; gap: 8px;
    }
    .preview-actions button {
        background: var(--colab-primary-surface-color, #ffffff); 
        border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; margin-left: 8px;
    }
    
    /* Buttons inside Preview */
    .btn-apply { color: #188038; } /* Left hardcoded because green means go */
    .btn-cancel { color: #d93025; } /* Left hardcoded because red means stop */
    
    .preview-code-container { 
        padding: 12px; font-family: monospace; font-size: 13px; white-space: pre-wrap; overflow-y: auto; 
        color: var(--colab-primary-text-color, #202124); 
        max-height: 400px; 
    }
    
    /* Diff Colors (Converted to RGBA to work perfectly in both Light & Dark modes) */
    .diff-line { display: block; width: 100%; padding: 0 4px; border-radius: 2px; }
    .diff-added { background: rgba(46, 160, 67, 0.15); color: #3fb950; }
    .diff-removed { background: rgba(248, 81, 73, 0.15); color: #ff7b72; }
    .diff-unchanged { color: var(--colab-secondary-text-color, #57606a); }

    /* Checkpoints & Dividers */
    .checkpoint-action { 
        padding: 10px 12px; 
        background: var(--colab-secondary-surface-color, #fff8e1); 
        font-weight: 600; cursor: pointer; 
        border-bottom: 2px solid var(--colab-border-color, #f1f3f4); 
        color: var(--colab-call-to-action-color, #b08d00); 
        display: flex; align-items: center; gap: 6px; 
    }
    .checkpoint-action:hover { 
        background: var(--colab-highlighted-surface-color, #ffecb3); 
    }
    .history-divider { 
        padding: 4px 12px; font-size: 10px; 
        color: var(--colab-secondary-text-color, #80868b); 
        text-transform: uppercase; 
        background: var(--colab-secondary-surface-color, #f8f9fa); 
        font-weight: bold; letter-spacing: 0.5px; 
    }
    .checkpoint-item { 
        background: var(--colab-primary-surface-color, #fffdf7); 
    }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// --- 2. INJECTION LOGIC ---
setInterval(() => {
    // 1. Find the custom toolbars
    const toolbars = document.querySelectorAll('colab-cell-toolbar');
    
    toolbars.forEach(toolbar => {
        // 2. 🚨 THE FORCEFIELD CHECK: Make sure the Shadow DOM is ready
        if (!toolbar.shadowRoot) return;

        // 3. Prevent duplicates INSIDE the shadow root
        if (toolbar.shadowRoot.querySelector('.colab-rewind-btn')) return;

        // Find the parent cell for our database tracking
        const cellElement = toolbar.closest('colab-code-cell, .cell');
        if (!cellElement) return;

        // 4. Create the Button
        const btn = document.createElement('button');
        btn.className = 'colab-rewind-btn';
        
        // As you suggested, we can start with text + icon. 
        // If it takes up too much space, just change this to "↺" later!
        btn.innerHTML = `↺ Rewind`;

        // 5. 🚨 INLINE STYLES: 
        btn.style.background = 'transparent';
        btn.style.border = 'none';
        btn.style.color = 'var(--colab-icon-color, #5f6368)'; /* 🚨 Changed to crisp white */
        
        btn.style.cursor = 'pointer';
        btn.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'; /* Matches native UI font */
        btn.style.fontWeight = '500'; /* Slightly thinner, more professional weight */
        btn.style.fontSize = '12px';
        btn.style.padding = '0 12px'; /* Wider padding for a better click target */
        btn.style.marginRight = '4px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.height = '32px'; /* 🚨 Matches Colab's exact native icon height */
        btn.style.borderRadius = '4px';
        
        // JS-based hover effect
        btn.onmouseover = () => btn.style.background = 'rgba(255, 255, 255, 0.1)'; /* Gentle white hover state */
        btn.onmouseout = () => btn.style.background = 'transparent';

        // 6. Create the Dropdown (We keep this on the main document body so it doesn't get trapped)
        const dropdown = document.createElement('div');
        dropdown.className = 'colab-rewind-dropdown';
        document.body.appendChild(dropdown);

        // 7. Connect the Click Listener
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            document.querySelectorAll('.colab-rewind-dropdown.show').forEach(d => { if (d !== dropdown) d.classList.remove('show'); });

            const isOpening = !dropdown.classList.contains('show');
            if (isOpening) {
                const rect = btn.getBoundingClientRect();
                dropdown.style.position = 'fixed';
                dropdown.style.top = `${rect.bottom + 4}px`; 
                let leftPos = rect.right - 300; 
                if (leftPos < 10) leftPos = rect.left; 
                dropdown.style.left = `${leftPos}px`;

                dropdown.classList.add('show');
                dropdown.innerHTML = '<div class="rewind-empty">Loading history...</div>';
                
                const notebookId = window.location.pathname; // 🚨 GRAB THE URL
                
                chrome.runtime.sendMessage({ action: 'GET_CELL_HISTORY', data: { notebookId: notebookId, id: cellElement.id } }, (response) => {
                    if (response && response.status === "success") {
                        renderDropdownContent(dropdown, response.data, cellElement); 
                    } else {
                        dropdown.innerHTML = '<div class="rewind-empty">Error loading history.</div>';
                    }
                });
            } else {
                dropdown.classList.remove('show');
            }
        });

        // 8. 🚨 PIERCE THE SHADOW DOM: Prepend it directly inside the shadow root!
        toolbar.shadowRoot.prepend(btn);
    });
}, 150);

// --- 3. MENU RENDERER (CHECKPOINTS + HISTORY) ---
function renderDropdownContent(dropdown, historyData, cellElement) {
    dropdown.innerHTML = ''; 

    const saveBtn = document.createElement('div');
    saveBtn.className = 'checkpoint-action';
    saveBtn.innerHTML = `⭐ Pin Current Code as Checkpoint`;
    saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentTextElement = cellElement.querySelector('.view-lines');
        if (!currentTextElement) return;
        const currentText = currentTextElement.innerText.replace(/\u200B/g, '');
        
        const notebookId = window.location.pathname; // 🚨 GRAB THE URL
        
        chrome.runtime.sendMessage({ action: 'SAVE_CELL_RUN', data: { notebookId: notebookId, id: cellElement.id, text: currentText, isCheckpoint: true } }, () => {
            dropdown.classList.remove('show');
            alert("⭐ Checkpoint Saved! It will never be auto-deleted.");
        });
    });
    dropdown.appendChild(saveBtn);

    // ==========================================
    // 👑 THE CHECKPOINTS ONLY TOGGLE
    // ==========================================
    const filterContainer = document.createElement('div');
    // Using your native Colab variables so it adapts perfectly to Light/Dark mode!
    filterContainer.style.padding = '8px 12px';
    filterContainer.style.background = 'var(--colab-highlighted-surface-color, #f8f9fa)';
    filterContainer.style.borderBottom = '1px solid var(--colab-border-color, #f1f3f4)';
    filterContainer.style.display = 'flex';
    filterContainer.style.alignItems = 'center';
    filterContainer.style.gap = '8px';
    filterContainer.style.fontSize = '12px';
    filterContainer.style.color = 'var(--colab-primary-text-color, #3c4043)';
    
    filterContainer.innerHTML = `
        <input type="checkbox" id="checkpoint-filter" style="cursor: pointer; accent-color: var(--colab-call-to-action-color, #1a73e8);">
        <label for="checkpoint-filter" style="cursor: pointer; font-weight: 500; user-select: none;">Show Checkpoints Only</label>
    `;
    dropdown.appendChild(filterContainer);

    // Prevent clicking the background of the toggle area from closing the menu
    filterContainer.addEventListener('click', (e) => e.stopPropagation());

    // The Magic Filter Logic using your CSS Classes
    const checkbox = filterContainer.querySelector('#checkpoint-filter');
    checkbox.addEventListener('change', (e) => {
        // Prevent the checkbox click from closing the dropdown
        e.stopPropagation(); 
        
        const isChecked = e.target.checked;
        
        // 1. Find all standard runs (items that have .rewind-item but NOT .checkpoint-item)
        const standardItems = dropdown.querySelectorAll('.rewind-item:not(.checkpoint-item)');
        standardItems.forEach(item => {
            // Because we upgraded your row to Flexbox earlier, we toggle back to 'flex', not 'block'!
            item.style.display = isChecked ? 'none' : 'flex'; 
        });

        // 2. Hide the "Recent Runs" text divider to keep the UI super clean
        const dividers = dropdown.querySelectorAll('.history-divider');
        dividers.forEach(div => {
            // 🚨 Changed innerText to textContent to bypass the CSS uppercase rule!
            if (div.textContent.includes('Recent Runs')) {
                div.style.display = isChecked ? 'none' : 'block';
            }
        });
    });
    // ==========================================

    if (!historyData || historyData.length === 0) {
        dropdown.innerHTML += '<div class="rewind-empty">No previous runs tracked yet.</div>';
        return;
    }

    const checkpoints = historyData.filter(r => r.isCheckpoint);
    const standardRuns = historyData.filter(r => !r.isCheckpoint);

    if (checkpoints.length > 0) {
        const div = document.createElement('div'); div.className = 'history-divider'; div.innerText = 'Pinned Checkpoints'; dropdown.appendChild(div);
        checkpoints.forEach((run) => {
            const item = document.createElement('div'); item.className = 'rewind-item checkpoint-item';
            const time = new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const lines = run.text.split('\n').length;
            item.innerHTML = `⭐ Checkpoint <span style="color:#80868b; font-size:10px;">(${lines} lines)</span> <span style="float:right;">${time}</span>`;
            item.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.remove('show'); showPreviewOverlay(cellElement, run); });
            dropdown.appendChild(item);
        });
    }

    if (standardRuns.length > 0) {
        const div = document.createElement('div'); div.className = 'history-divider'; div.innerText = 'Recent Runs'; dropdown.appendChild(div);
        
        standardRuns.forEach((run, index) => {
            const item = document.createElement('div'); 
            item.className = 'rewind-item';
            
            // 1. Upgrade the layout to flexbox to keep everything perfectly aligned
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            
            const time = new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            // 2. Inject the '×' button into the HTML
            item.innerHTML = `
                <span><strong>Run ${standardRuns.length - index}</strong></span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color:var(--colab-secondary-text-color, #80868b);">${time}</span>
                    <span class="delete-run" style="font-size: 16px; font-weight: bold; color: var(--colab-icon-color, #5f6368); cursor: pointer; padding: 0 4px;" title="Delete this run">×</span>
                </div>
            `;

            // 3. Keep your existing row click listener (for opening the restore preview)
            item.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                dropdown.classList.remove('show'); 
                showPreviewOverlay(cellElement, run); 
            });

            // 4. 🚨 ADD THE TRASH CAN LISTENER HERE 🚨
            const deleteBtn = item.querySelector('.delete-run');
            deleteBtn.addEventListener('click', (e) => {
                // Critical: Stop the row's click listener from firing!
                e.stopPropagation(); 
                
                // Optional: Make it turn red when hovering over the X
                deleteBtn.style.color = '#d93025'; 
                
                chrome.runtime.sendMessage({ action: 'DELETE_RUN', data: { timestamp: run.timestamp } }, (response) => {
                    if (response && response.success) {
                        // Instantly delete the row from the dropdown UI for a snappy feel
                        item.remove(); 
                    }
                });
            });

            dropdown.appendChild(item);
        });
    }
}

// --- 4. PREVIEW & DIFF ENGINE ---
function showPreviewOverlay(cellElement, runData) {
    const existing = cellElement.querySelector('.colab-rewind-preview-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'colab-rewind-preview-overlay';

    const timeString = new Date(runData.timestamp).toLocaleTimeString();
    const currentTextElement = cellElement.querySelector('.view-lines');
    const currentText = currentTextElement ? currentTextElement.innerText.replace(/\u200B/g, '') : "";
    const diffHTML = generateDiffHTML(currentText, runData.text);

    overlay.innerHTML = `
        <div class="preview-header">
            <span>Viewing Historical Run (${timeString})</span>
            <div class="preview-actions">
                <button class="btn-cancel" id="btn-cancel-rewind">Cancel</button>
                <button class="btn-apply" id="btn-apply-rewind">Restore</button>
            </div>
        </div>
        <div class="preview-code-container">${diffHTML}</div>
    `;

    const toolbar = cellElement.querySelector('colab-cell-action-bar') || cellElement.querySelector('.cell-toolbar') || cellElement.querySelector('.action-bar') || cellElement.querySelector('colab-cell-toolbar');
    if (toolbar) toolbar.insertAdjacentElement('afterend', overlay);
    else cellElement.prepend(overlay);

    overlay.querySelector('#btn-cancel-rewind').addEventListener('click', (e) => { e.stopPropagation(); overlay.remove(); });
    overlay.querySelector('#btn-apply-rewind').addEventListener('click', (e) => { e.stopPropagation(); restoreCodeToCell(cellElement, runData.text); overlay.remove(); });
}

function restoreCodeToCell(cellElement, oldText) {
    // 1. Find Monaco's hidden keystroke catcher
    const textarea = cellElement.querySelector('.monaco-editor textarea');

    if (!textarea) { 
        alert("Error: Could not locate the editor area."); 
        return; 
    }

    // 2. Force the browser to look ONLY at the code box
    textarea.focus();

    // 3. Give the browser 50ms to shift focus away from the Restore button
    setTimeout(() => {
        // 4. Highlight all text inside the hidden box
        textarea.select();

        // 5. 🚨 THE NUKE: Tell the browser to press the "Delete" key natively.
        // This forces Monaco's visual brain to wake up, wipe the screen, and reset the cursor to line 1!
        document.execCommand('delete', false, null);

        // 6. Give Monaco 50ms to process the deletion and clear the UI...
        setTimeout(() => {
            // 7. 🚨 THE PAVE: Now that the cell is completely empty, inject the historical code!
            document.execCommand('insertText', false, oldText);
            
            console.log("[Colab Rewind] Code successfully overwritten!");
        }, 10);

    }, 10);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
}

function generateDiffHTML(oldText, newText) {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    let startMatch = 0;
    while (startMatch < oldLines.length && startMatch < newLines.length && oldLines[startMatch] === newLines[startMatch]) startMatch++;
    let endMatchOld = oldLines.length - 1; let endMatchNew = newLines.length - 1;
    while (endMatchOld >= startMatch && endMatchNew >= startMatch && oldLines[endMatchOld] === newLines[endMatchNew]) { endMatchOld--; endMatchNew--; }

    let html = '';
    for (let i = 0; i < startMatch; i++) html += `<span class="diff-line diff-unchanged">  ${escapeHTML(oldLines[i])}</span>`;
    for (let i = startMatch; i <= endMatchOld; i++) html += `<span class="diff-line diff-removed">- ${escapeHTML(oldLines[i])}</span>`;
    for (let i = startMatch; i <= endMatchNew; i++) html += `<span class="diff-line diff-added">+ ${escapeHTML(newLines[i])}</span>`;
    for (let i = endMatchOld + 1; i < oldLines.length; i++) html += `<span class="diff-line diff-unchanged">  ${escapeHTML(oldLines[i])}</span>`;
    return html || '<span class="diff-line diff-unchanged">No changes detected.</span>';
}

// ==========================================
// 5. THE AUTO-SAVE ENGINE (EXECUTION TRACKING)
// ==========================================

function captureAndSaveRun(cellElement) {
    if (!cellElement || !cellElement.id) return;
    const editor = cellElement.querySelector('.view-lines');
    if (!editor) return;
    
    const currentText = editor.innerText.replace(/\u200B/g, '');
    const notebookId = window.location.pathname; // 🚨 GRAB THE URL
    
    chrome.runtime.sendMessage({ 
        action: 'SAVE_CELL_RUN', 
        data: { notebookId: notebookId, id: cellElement.id, text: currentText, isCheckpoint: false } 
    });
    console.log("[Colab Rewind] Auto-saved run for cell:", cellElement.id);
}

// 🚨 TRIGGER 1: Keyboard Shortcuts (Shift+Enter or Ctrl+Enter)
// By adding 'true' at the end, we intercept the event on the way DOWN (Capture Phase) 
// before Colab has a chance to block it!
document.addEventListener('keydown', (e) => {
    if ((e.shiftKey || e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeCell = document.activeElement.closest('colab-code-cell, .cell');
        if (activeCell) {
            // Give Monaco 100ms to register your very last keystroke before we grab the code
            setTimeout(() => {
                captureAndSaveRun(activeCell);
            }, 100);
        }
    }
}, true); // <--- THIS IS THE MAGIC BULLET

// 🚨 TRIGGER 2: Mouse Clicks on the Play Button
document.addEventListener('click', (e) => {
    // Google Colab uses specific custom tags for their play buttons
    const playButton = e.target.closest('colab-run-button, [aria-label*="Run cell"]');
    if (playButton) {
        const activeCell = playButton.closest('colab-code-cell, .cell');
        if (activeCell) {
            captureAndSaveRun(activeCell);
        }
    }
});