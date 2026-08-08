# URL Query Editor 🌽

A Chrome extension for easily editing the domain, path, and query parameters of a URL.

## ✨ Features

- 🌐 Switch the protocol and domain of the current page — handy for moving a URL between localhost, staging, and production
- 🛣️ Edit the path of the current page
- ↩️ One-click reset of the domain or path back to the original
- 📐 Collapsible Domain / Path sections (the state is remembered between sessions)
- 📝 Edit query parameters of the current page
- ➕ Add new parameters
- ✏️ Modify existing parameters
- 🗑️ Delete unwanted parameters
- 🧹 Clear all parameters at once
- 👀 Live preview of the resulting URL
- 🔄 Apply changes and reload the page

## 🚀 Installation

### Load Locally (Developer Mode)

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** in the top right corner
4. Click **Load unpacked**
5. Select this project folder
6. ✅ Done! The extension will be loaded immediately

## 📖 Usage

1. Click the extension icon 🌽 in the browser toolbar
2. A popup will display the current page's URL, its domain, its path, and all query parameters
3. You can:
   - Edit the protocol (`https` → `http`) and the domain (host and port) by typing directly
   - Paste a full URL into the domain field — the protocol and host are extracted automatically
   - Edit the path directly; click "Reset" on either section to restore the original value
   - Click a section title to collapse it and give the parameter list more room
   - Click "Add" to add a new parameter
   - Edit parameter names and values directly
   - Click the ✕ next to a parameter to remove it
   - Click "Clear" to remove all parameters
4. After editing, click "Apply" (or press Enter)
5. The page will reload with the updated URL

## 🛠️ Tech Stack

- **Manifest V3** — Latest Chrome Extension API
- **Vanilla JavaScript** — No external dependencies
- **Chrome Tabs API** — Tab URL manipulation
- **URLSearchParams** — Query parameter handling

## 📁 Project Structure

```
url-query-editor/
├── manifest.json          # Extension configuration
├── popup.html             # Popup window HTML
├── popup.css              # Styles
├── popup.js               # Core logic
├── icon-16.png            # 16x16 icon
├── icon-48.png            # 48x48 icon
├── icon-128.png           # 128x128 icon
├── docs/
│   └── privacy-policy.html # Privacy policy (GitHub Pages)
└── README.md              # This file
```

## 🎨 UI Design

- Modern purple gradient theme
- Responsive card layout
- Smooth animations
- Custom scrollbar styling
- SVG icons

## 🤝 Use Cases

- Development & debugging
- Testing different parameter combinations
- Quickly modifying URLs without manual editing
- API testing

## 📄 License

MIT License

## 👤 Author

Chris Lee
