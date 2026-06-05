# Colab Rewind

A lightweight, local Chrome extension that brings robust cell-level version control and git-like diff capabilities directly into Google Colab. 

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Free-blue.svg)](https://chromewebstore.google.com/detail/chkegoghpamlolloililmdpccogpfcmn?utm_source=item-share-cb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## The Problem
Data scientists and machine learning engineers frequently use Google Colab for rapid prototyping, but the platform lacks fine-grained local code history. Experimenting with code, tweaking model parameters, or overwriting a working snippet can easily disrupt your workflow, and struggling to recover those specific past iterations can cost you hours of lost work.

Colab Rewind solves this by operating entirely in the background, keeping track of your code modifications locally so you can undo any mistake instantly.

## Features
* **Automated Execution Tracking:** Silently logs your cell execution history as you work natively in Colab.
* **Manual Checkpoints:** Click "Add Checkpoint" at any milestone to save a pristine snapshot of your notebook's current state.
* **Git-Like Diff Viewer:** Visual side-by-side comparison interface to inspect changes before reverting code.
* **100% Local and Private:** No servers, no tracking, and no external API calls. Your code never leaves your machine, storing everything securely via browser storage.

## Tech Stack and Architecture
* **Frontend UI:** JavaScript (ES6+), HTML5, CSS3.
* **Storage Engine:** HTML5 IndexedDB API for high-capacity, structured, offline client-side storage.
* **Interactions:** Chrome Extension APIs (Content Scripts and Background Service Workers) to safely inject logic into the Colab DOM without hurting runtime performance.

## How to Install Locally (For Developers)
If you want to tweak the code or load it manually:
1. Clone this repository: `git clone https://github.com/rythmkumar/colab-rewind.git`
2. Open Google Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle switch in the top-right corner).
4. Click **Load unpacked** in the top-left corner and select the root directory of this project.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.