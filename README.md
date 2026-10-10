# URL Query Editor 🌽

A Chrome extension for easily editing the domain, path, and query parameters of a URL.

## ✨ Features

- 🌐 Edit the protocol, domain, and path of the current page in one address bar — handy for moving a URL between localhost, staging, and production
- 📋 Paste a full URL and its query string is split into the parameter list automatically
- ↩️ One-click reset of the address back to the original
- 📐 The address bar wraps to at most two lines, leaving more room for query parameters
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
2. A popup will display an editable address bar (everything before the `?`) and all query parameters
3. You can:
   - Edit the address directly, for example `https://example.com/a` → `http://localhost:3000/a`; if you leave out the protocol, the page's original one is used
   - Paste a full URL into the address bar — its query parameters are moved into the parameter list
   - The address bar turns red when the URL is invalid; click the reset icon next to it to restore the original address
   - Hover over the address bar to see the full URL, or click the copy icon to copy it
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
