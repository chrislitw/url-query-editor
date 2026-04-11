let currentUrl = '';
let currentParams = new Map();

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentUrl();
  renderParams();
  setupEventListeners();
});

// 獲取當前分頁的 URL
async function loadCurrentUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      currentUrl = tab.url;
      const url = new URL(currentUrl);

      // 顯示當前 URL
      document.getElementById('currentUrl').textContent = currentUrl;

      // 解析 query 參數
      currentParams.clear();
      url.searchParams.forEach((value, key) => {
        currentParams.set(key, value);
      });
    }
  } catch (error) {
    console.error('獲取 URL 失敗:', error);
    document.getElementById('currentUrl').textContent = '無法獲取當前頁面 URL';
  }
}

// 渲染參數列表
function renderParams() {
  const paramsList = document.getElementById('paramsList');
  paramsList.innerHTML = '';

  if (currentParams.size === 0) {
    paramsList.innerHTML = '<div class="empty-state">目前沒有查詢參數<br>點擊上方按鈕新增</div>';
    return;
  }

  currentParams.forEach((value, key) => {
    const paramItem = createParamItem(key, value);
    paramsList.appendChild(paramItem);
  });
}

// 建立參數項目
function createParamItem(key, value) {
  const div = document.createElement('div');
  div.className = 'param-item';

  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.className = 'param-key';
  keyInput.value = key;
  keyInput.placeholder = '參數名';
  keyInput.dataset.originalKey = key;

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'param-value';
  valueInput.value = value;
  valueInput.placeholder = '參數值';

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn btn-remove';
  removeBtn.textContent = '刪除';
  removeBtn.onclick = () => {
    currentParams.delete(key);
    renderParams();
  };

  // 監聽輸入變化
  keyInput.addEventListener('input', (e) => {
    const oldKey = e.target.dataset.originalKey;
    const newKey = e.target.value;

    if (oldKey !== newKey && newKey) {
      const val = currentParams.get(oldKey);
      currentParams.delete(oldKey);
      currentParams.set(newKey, val);
      e.target.dataset.originalKey = newKey;
    }
  });

  valueInput.addEventListener('input', (e) => {
    const key = keyInput.dataset.originalKey;
    currentParams.set(key, e.target.value);
  });

  div.appendChild(keyInput);
  div.appendChild(valueInput);
  div.appendChild(removeBtn);

  return div;
}

// 設定事件監聽器
function setupEventListeners() {
  // 新增參數
  document.getElementById('addParam').addEventListener('click', () => {
    const newKey = `param${currentParams.size + 1}`;
    currentParams.set(newKey, '');
    renderParams();
  });

  // 清空全部參數
  document.getElementById('clearAll').addEventListener('click', () => {
    if (currentParams.size > 0 && confirm('確定要清空所有參數嗎？')) {
      currentParams.clear();
      renderParams();
    }
  });

  // 套用並重新整理
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    try {
      const url = new URL(currentUrl);

      // 清空原有的查詢參數
      url.search = '';

      // 加入新的參數
      currentParams.forEach((value, key) => {
        if (key.trim()) {  // 只加入非空的 key
          url.searchParams.set(key, value);
        }
      });

      const newUrl = url.toString();

      // 更新分頁 URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.update(tab.id, { url: newUrl });

      // 關閉彈窗
      window.close();
    } catch (error) {
      console.error('重新整理失敗:', error);
      alert('重新整理失敗，請檢查 URL 是否有效');
    }
  });
}
