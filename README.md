<p align="center">
  <img src="assets/logo.png" alt="Enter to Send Logo" width="160">
</p>

<h1 align="center">Enter to Send</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-black?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/License-MIT-111827?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/Zero-Dependencies-emerald?style=flat-square" alt="Zero Dependencies">
</p>

<p align="center">
  A lightweight, distraction-free Chrome extension that flips the script on web text inputs: press <strong>Enter</strong> to send your message or submit your prompt, and use <strong>Shift + Enter</strong> when you actually need a new line.
</p>

---

## The Problem

Many modern web apps, developer consoles, and AI workspaces (such as Google AI Studio, custom web editors, and discussion boards) treat inputs as multiline text editors by default:

* Pressing **`Enter`** merely inserts an unwanted line break.
* Submitting requires a two-handed chord: **`Cmd + Enter`** (macOS) or **`Ctrl + Enter`** (Windows/Linux).
* If you compose frequent short messages, prompts, or dictated inputs, having to reach for a modifier key every single time creates friction and breaks your typing flow.

---

## The Solution

**Enter to Send** standardizes keyboard interactions to match the intuitive chat model you already expect:

| Keystroke | Behavior |
| :--- | :--- |
| **`Enter`** | **Sends the message / runs the prompt** immediately |
| **`Shift + Enter`** | **Inserts a new line** for paragraphs or formatted text |
| **`Cmd + Enter`** / **`Ctrl + Enter`** | **Preserved** (original shortcuts continue to work) |

---

## Features

- **Universal Compatibility:** Works across web applications, chat interfaces, and developer playgrounds without requiring platform-specific configuration.
- **Granular Control:**
  - **Global Toggle:** Pause or activate the extension with a single switch.
  - **Per-Site Whitelist/Blacklist:** Toggle the extension on or off for individual domains directly from the popup.
- **Minimalist Design:** Built with a clean, neutral, monochrome interface that stays out of your way.
- **Zero Overhead:** No third-party frameworks, no tracking, and no external network calls. Runs entirely offline in local memory.
- **Capture-Phase Execution:** Intercepts the keypress before web frameworks handle it, preventing awkward trailing blank lines.

---

## Installation

### Load into Google Chrome

1. Clone or download this repository:
   ```bash
   git clone https://github.com/sandeepisconscious-create/enter-to-send.git
   ```
2. Open Google Chrome and navigate to:
   ```
   chrome://extensions/
   ```
3. Enable **Developer mode** via the toggle switch in the upper-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the project folder:
   ```
   Enter 2 send
   ```
6. *(Optional)* Pin the extension icon to your Chrome toolbar for quick access to site toggles.

---

## Project Structure

```
├── assets/
│   └── logo.png          # High-resolution project logo
├── manifest.json         # Chrome Extension Manifest V3 configuration
├── content.js            # Capture-phase keyboard interceptor & submission engine
├── popup/
│   ├── popup.html        # Clean, accessible popup interface
│   ├── popup.css         # Minimalist styling
│   └── popup.js          # Domain-level and global state management
├── icons/                # Extension icons (16, 48, 128px)
├── LICENSE               # MIT License
└── README.md             # Project documentation and usage guide
```

---

## How It Works Under the Hood

1. **Capture Phase Listener:** The content script registers `window.addEventListener('keydown', handler, true)` during the DOM capture phase, allowing it to intercept `Enter` before a web app's internal handlers can insert a line break.
2. **IME Guard:** Text input during active IME composition (e.g. non-Latin character finalization) is safely ignored so submissions are never sent prematurely.
3. **Multi-Strategy Submission:**
   - **Strategy 1:** Locates and triggers the contextual submit/run button (supporting standard buttons, accessible labels, and action icons).
   - **Strategy 2:** Invokes form-level `requestSubmit()` where semantic `<form>` structures exist.
   - **Strategy 3:** Synthesizes and dispatches an authentic `Cmd + Enter` / `Ctrl + Enter` event directly to the active element.

---

## License & Author

Created by **Sandheep Rao**.

Distributed under the [MIT License](LICENSE). Free to use, modify, and distribute.
