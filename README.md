# URL 參數編輯器 🌽

輕鬆編輯網頁 URL 查詢參數的 Chrome 擴充功能。

## ✨ 功能特點

- 📝 編輯當前頁面的 query 參數
- ➕ 添加新的參數
- ✏️ 修改現有參數
- 🗑️ 刪除不需要的參數
- 🧹 一鍵清空所有參數
- 🔄 套用修改並重新整理頁面

## 🚀 安裝方式

### 本地載入（開發模式）

1. 打開 Chrome 瀏覽器
2. 在地址欄輸入：`chrome://extensions/`
3. 右上角開啟「**開發者模式**」
4. 點擊「**載入未封裝項目**」
5. 選擇此專案資料夾
6. ✅ 完成！擴充功能會立即載入

## 📖 使用說明

1. 點擊瀏覽器工具列的擴充功能圖示 🌽
2. 彈出視窗會顯示當前頁面的 URL 和所有查詢參數
3. 可以：
   - 點擊「新增參數」按鈕新增參數
   - 直接編輯參數名稱和值
   - 點擊「刪除」按鈕移除特定參數
   - 點擊「清空全部」移除所有參數
4. 編輯完成後，點擊「套用並重新整理」
5. 頁面會使用新的 URL 參數重新載入

## 🛠️ 技術架構

- **Manifest V3**：使用最新的 Chrome Extension API
- **原生 JavaScript**：無外部依賴
- **Chrome Tabs API**：操作分頁 URL
- **URLSearchParams**：處理查詢參數

## 📁 專案結構

```
url-query-editor/
├── manifest.json          # 擴充功能配置
├── popup.html            # 彈出視窗 HTML
├── popup.css             # 樣式表
├── popup.js              # 核心邏輯
├── icon-16.png           # 16x16 圖示
├── icon-48.png           # 48x48 圖示
├── icon-128.png          # 128x128 圖示
├── CHROME_STORE.md       # Chrome Web Store 上傳指南
└── README.md             # 本文件
```

## 🎨 介面設計

- 現代化紫色漸層主題
- 響應式卡片佈局
- 流暢的動畫效果
- 自訂捲軸樣式
- SVG 圖示

## 📦 發布到 Chrome Web Store

詳細步驟請參考 [CHROME_STORE.md](./CHROME_STORE.md)

## 🤝 適用場景

- 開發調試
- 測試不同參數組合
- 快速修改 URL 而無需手動編輯
- API 測試

## 📄 授權

MIT License

## 👤 作者

Chris Lee
