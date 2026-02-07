# MagicBoard 🎨

**MagicBoard** is a lightweight, zero-setup whiteboard web application designed for rapid visual thinking, brainstorming, and live presentations. It offers a distraction-free interface with powerful sketching and annotation tools, running entirely in the browser without any backend dependencies.

## 🚀 Getting Started

Visit [MagicBoard Page](https://foacode.github.io/MagicBoard) for a test version of the app

OR

Get a copy of the repository:

1.  Clone the repository.
2.  Open `index.html` in any modern web browser.
3.  Start creating!

## ✨ Features

*   **Infinite Canvas**: Pan and zoom freely to organize your ideas.
*   **Drawing Tools**:
    *   Freehand sketching with smoothing.
    *   Straight lines (hold `Shift`).
    *   Arrow connectors (start/end markers).
    *   Customizable stroke width and colors.
*   **Rich Text**:
    *   Add text notes with formatting (Bold, Italic, Underline, Strikethrough).
    *   Adjust font size, text color, and background opacity.
*   **Image Support**:
    *   Drag & drop images directly onto the board.
    *   Paste images from your clipboard.
    *   Adjust image transparency.
*   **Object Management**:
    *   Lasso selection tool.
    *   Layer management (Bring to Front / Send to Back).
    *   Resize and move objects easily.
*   **Save & Load**:
    *   Export your board as a `.wb` file (bundles images and data).
    *   Import to resume work anytime.
*   **History**: Robust Undo/Redo system.

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `S` | Select Tool |
| `D` | Draw Tool |
| `T` | Text Tool |
| `Ctrl` + `Z` | Undo |
| `Ctrl` + `Y` | Redo |
| `Delete` / `Backspace` | Delete Selected Item |
| `Ctrl` + `Scroll` | Zoom In/Out |
| `Shift` (while drawing) | Draw Straight Line |
| `Alt` (while drawing) | Snap Line Angle (15°) |

## 🛠️ Technologies

*   **Core**: HTML5, CSS3, Vanilla JavaScript (ES6+).
*   **Rendering**: SVG for strokes, DOM elements for text/images.
*   **Dependencies**: JSZip (for file export/import).

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
