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

      updateParamCount();
    }
  } catch (error) {
    console.error('Failed to load URL:', error);
    document.getElementById('currentUrl').textContent = 'Unable to load current page URL';
  }
}

// 更新參數數量顯示
function updateParamCount() {
  const badge = document.getElementById('paramCount');
  const n = currentParams.size;
  badge.textContent = `${n} ${n === 1 ? 'param' : 'params'}`;
}

// 根據目前參數組裝新網址
function buildUrl() {
  const url = new URL(currentUrl);
  url.search = '';
  currentParams.forEach((value, key) => {
    if (key.trim()) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

// 即時更新 URL 顯示
function updateUrlDisplay() {
  try {
    document.getElementById('currentUrl').textContent = buildUrl();
  } catch (error) {
    // 保留原 URL 顯示，避免輸入過程中暫時無效的狀態閃爍
  }
}

// 顯示 toast 提示
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

// 渲染參數列表
function renderParams() {
  const paramsList = document.getElementById('paramsList');
  paramsList.innerHTML = '';
  updateParamCount();
  updateUrlDisplay();

  if (currentParams.size === 0) {
    paramsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
          </svg>
        </div>
        No query parameters yet<br>Click "Add" to create one
      </div>`;
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
  keyInput.placeholder = 'Key';
  keyInput.dataset.originalKey = key;

  const separator = document.createElement('span');
  separator.className = 'param-separator';
  separator.textContent = '=';

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'param-value';
  valueInput.value = value;
  valueInput.placeholder = 'Value';

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn-delete';
  removeBtn.title = 'Delete';
  removeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
  </svg>`;
  removeBtn.onclick = () => {
    currentParams.delete(keyInput.dataset.originalKey);
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
    updateUrlDisplay();
  });

  valueInput.addEventListener('input', (e) => {
    const key = keyInput.dataset.originalKey;
    currentParams.set(key, e.target.value);
    updateUrlDisplay();
  });

  div.appendChild(keyInput);
  div.appendChild(separator);
  div.appendChild(valueInput);
  div.appendChild(removeBtn);

  return div;
}

// 設定事件監聯器
function setupEventListeners() {
  // 複製網址
  document.getElementById('copyUrl').addEventListener('click', () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      const btn = document.getElementById('copyUrl');
      btn.classList.add('copied');
      showToast('URL copied');
      setTimeout(() => btn.classList.remove('copied'), 1500);
    });
  });

  // 新增參數
  document.getElementById('addParam').addEventListener('click', () => {
    const newKey = `param${currentParams.size + 1}`;
    currentParams.set(newKey, '');
    renderParams();

    // 自動聚焦到新增的參數名稱輸入框
    const items = document.querySelectorAll('.param-item');
    const lastItem = items[items.length - 1];
    if (lastItem) {
      const keyInput = lastItem.querySelector('.param-key');
      keyInput.focus();
      keyInput.select();
    }
  });

  // 清空全部參數
  document.getElementById('clearAll').addEventListener('click', () => {
    if (currentParams.size > 0 && confirm('Clear all parameters?')) {
      currentParams.clear();
      renderParams();
      showToast('All parameters cleared');
    }
  });

  // 套用並重新整理
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    try {
      const newUrl = buildUrl();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.update(tab.id, { url: newUrl });
      window.close();
    } catch (error) {
      console.error('Apply failed:', error);
      alert('Apply failed. Please check the URL is valid.');
    }
  });
}
