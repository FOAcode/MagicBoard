# MagicBoard 🎨

A lightweight, zero-setup whiteboard web application designed for rapid visual thinking, brainstorming, live presentations, and collaborative sketching. MagicBoard offers a distraction-free interface with powerful drawing and annotation tools, running entirely in the browser without any backend dependencies or installation required.

## 🚀 Quick Start

**Online Version:**  
Visit [MagicBoard Live](https://foacode.github.io/MagicBoard) to start using it immediately.

**Local Setup:**
1. Clone the repository: `git clone https://github.com/FOAcode/MagicBoard.git`
2. Open `index.html` in any modern web browser
3. Start creating!

No build process, no dependencies to install—just open and draw.

---

## ✨ Core Features

### 🎨 Drawing Tools
- **Freehand Sketching**: Smooth, pressure-sensitive drawing with real-time rendering
- **Straight Lines**: Hold `Shift` while drawing to create connected straight lines
- **Individual Line Segments**: `Shift` + `Alt` for isolated straight segments
- **Angle Snapping**: `Shift` + `Ctrl` to snap lines to 15° increments
- **Arrow Connectors**: Add arrows with customizable start/end markers
- **Customizable Strokes**:
  - Adjustable stroke width (1-25px with logarithmic scaling)
  - 16.7M color options via color picker
  - Rounded corner support for smoother curves
  - Circle transformation mode for geometric shapes

### 📝 Rich Text Support
- **Text Formatting**: Bold, Italic, Underline, Strikethrough
- **Font Selection**: Choose from multiple typefaces (Open Sans, Arial, Times New Roman, Georgia, Courier New, Verdana)
- **Text Styling**:
  - Adjustable font size with auto-fit to container
  - Custom text color
  - Background color with opacity control (0-100%)
  - Text alignment options (left, center, right)
- **Inline Editing**: Edit text directly on the canvas

### 🖼️ Image Support
- **Multiple Import Methods**:
  - Drag & drop images directly onto the board
  - Paste images from clipboard (Ctrl/Cmd + V)
  - Full support for PNG, JPG, GIF, WebP formats
- **Image Manipulation**:
  - Adjustable transparency (0-100%)
  - Flip horizontally or vertically
  - Resize freely with aspect ratio preservation
  - Automatic pixelation detection for low-resolution displays

### 🎯 Selection & Editing
- **Multiple Selection Modes**:
  - Lasso selection tool (freehand selection of multiple items)
  - Rectangular selection mode
  - Individual item selection
- **Multi-Select**: `Ctrl/Cmd` + Click to add/remove items from selection
- **Layer Management**:
  - Bring Forward / Send to Back
  - Visual layer panel showing all objects
  - Z-index based stacking

### 🔄 Canvas Navigation
- **Infinite Canvas**: Pan and zoom without limits
- **Zoom Controls**:
  - `Ctrl` + Mouse Wheel to zoom in/out
  - Pinch-to-zoom on touch devices
  - Zoom reset button to fit all content
  - Smooth scaling with cursor-centered zoom
- **Panning**: Middle mouse button or spatial navigation
- **Touch Support**: Full gesture support for tablets and touch devices

### 💾 Save & Export
- **Whiteboard Format (.wb)**:
  - Save entire board state including all objects, text, and images
  - Automatic bundling of images and data
  - Import to resume work anytime
- **PNG Export**: Copy board content as PNG image to clipboard
- **Image Refit**: Automatically scale images to fit container

### ↩️ Undo/Redo System
- **Robust History**: Up to 50 undo/redo steps
- **Smart History**: Avoids recording redundant states
- **Keyboard Shortcuts**: `Ctrl` + `Z` (Undo), `Ctrl` + `Y` (Redo)

### ⚡ Advanced Features
- **Guides & Snap**: Visual guidelines for alignment and precision
- **Pressure Sensitivity**: Support for stylus/pen input with pressure detection
- **Multi-Device Support**:
  - Desktop (mouse, touchpad)
  - Tablet (touch, stylus)
  - Mobile (touch gestures)
  - Pen displays (pressure-sensitive)
- **Extension Detection**: Automatic detection and handling of browser extensions that may interfere with functionality
- **Copy to Clipboard**: Export selected items or board content as images
- **License Modal**: Click the footer to view license and project information

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Tool Selection** |
| `S` | Select Tool |
| `D` | Draw Tool |
| `T` | Text Tool |
| **Drawing** |
| `Shift` | Draw connected straight lines |
| `Shift` + `Alt` | Draw individual straight line segments |
| `Shift` + `Ctrl` | Snap line angle to 15° increments |
| **Editing** |
| `Ctrl` + `Z` | Undo |
| `Ctrl` + `Y` | Redo |
| `Delete` / `Backspace` | Delete selected item(s) |
| `Ctrl` + `C` | Copy selected items |
| `Ctrl` + `V` | Paste images or items |
| **Navigation** |
| `Ctrl` + `Scroll` | Zoom in/out |
| `Ctrl` + `F` | Refit to content |
| **Selection** |
| `Ctrl` / `Cmd` + Click | Add/remove item from selection |
| `Esc` | Clear selection / Close modals |

---

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3, ES6+ JavaScript
- **Graphics**: SVG for vector strokes, Canvas API for image export, DOM for text and image elements
- **Storage**: Browser localStorage for automatic saves, IndexedDB compatible
- **Dependencies**:
  - [JSZip](https://stuk.github.io/jszip/) — Compress/decompress .wb files
  - [html2canvas](https://html2canvas.hertzen.com/) — Export canvas to PNG
- **Browser Support**: All modern browsers (Chrome, Firefox, Safari, Edge) 

---

## 📦 File Format

MagicBoard saves work as `.wb` files (Whiteboard format), which are standard ZIP archives containing:
- `board.json` — Canvas state and all object data
- `images/` — Embedded images (bundled automatically)

This format ensures all your work, including images, can be transferred and opened anywhere.

---

## 🤝 Contributing

Found a bug or have a feature idea? Issues and pull requests are welcome!

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for full details.

**Copyright © 2025-2026 FOAcode**

For more information, visit the [GitHub repository](https://github.com/FOAcode/MagicBoard).
