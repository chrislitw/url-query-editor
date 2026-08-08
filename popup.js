let currentUrl = '';
let currentParams = new Map();
let currentProtocol = 'https:';
let currentHost = '';
let currentPath = '/';
let originalProtocol = 'https:';
let originalHost = '';
let originalPath = '/';

const COLLAPSE_KEY = 'collapsedSections';

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentUrl();
  setupCollapsibleSections();
  renderDomain();
  renderPath();
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

      // 解析 domain 與 path
      originalProtocol = url.protocol;
      originalHost = url.host;
      originalPath = url.pathname;
      currentProtocol = originalProtocol;
      currentHost = originalHost;
      currentPath = originalPath;

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

// 正規化協定：統一成小寫、結尾帶一個冒號
function normalizeProtocol(protocol) {
  return `${protocol.trim().toLowerCase().replace(/[:/]+$/, '')}:`;
}

// 協定只允許字母開頭的合法 scheme
function isProtocolValid(protocol) {
  return /^[a-z][a-z0-9+.-]*:$/.test(normalizeProtocol(protocol));
}

// 正規化 host：去掉協定前綴與 path 之後的部分
function normalizeHost(host) {
  return host
    .trim()
    .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '')
    .replace(/[/?#].*$/, '');
}

// 正規化 path：確保開頭有斜線
function normalizePath(path) {
  const trimmed = path.trim();
  if (!trimmed) return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

// 檢查 host 是否能被瀏覽器接受（設定失敗時 URL 會沿用原本的 host）
const HOST_PROBE = 'probe.invalid';

function isHostValid(host) {
  const normalized = normalizeHost(host);
  // file:// 這類網址本來就沒有 host，沒換過協定時留空是合法的
  if (!normalized) return currentProtocol === originalProtocol && originalHost === '';
  if (!isProtocolValid(currentProtocol)) return false;
  try {
    // 先塞一個必定合法的 host，之後只要值有變就代表新 host 被接受
    // （直接比對輸入值會誤判 example.com:443 這種預設埠會被省略的情況）
    const url = new URL(`${currentProtocol}//${HOST_PROBE}`);
    url.host = normalized;
    return url.host !== HOST_PROBE;
  } catch (error) {
    return false;
  }
}

// 根據目前 domain、path 與參數組裝新網址
function buildUrl() {
  const url = new URL(currentUrl);
  url.protocol = currentProtocol;
  url.host = normalizeHost(currentHost);
  url.pathname = normalizePath(currentPath);
  url.search = '';
  currentParams.forEach((value, key) => {
    if (key.trim()) {
      url.searchParams.set(key, value);
    }
  });

  // http/https 這類特殊協定與 chrome:、file: 之間不能直接互換，
  // URL 會忽略指派，這時改用字串重新組裝
  if (url.protocol !== currentProtocol) {
    const rebuilt = `${currentProtocol}//${normalizeHost(currentHost)}${normalizePath(currentPath)}${url.search}`;
    try {
      return new URL(rebuilt).toString();
    } catch (error) {
      return url.toString();
    }
  }

  return url.toString();
}

// 即時更新 URL 顯示與各區塊摘要
function updateUrlDisplay() {
  try {
    document.getElementById('currentUrl').textContent = buildUrl();
  } catch (error) {
    // 保留原 URL 顯示，避免輸入過程中暫時無效的狀態閃爍
  }

  const origin = `${currentProtocol}//${normalizeHost(currentHost)}`;
  document.getElementById('pathOrigin').textContent = origin;
  document.getElementById('domainSummary').textContent = origin;
  document.getElementById('pathSummary').textContent = normalizePath(currentPath);

  const isValid = isProtocolValid(currentProtocol) && isHostValid(currentHost);
  document.getElementById('domainField').classList.toggle('is-invalid', !isValid);
}

// 顯示 domain 並同步 Reset 按鈕狀態
function renderDomain() {
  const protocolInput = document.getElementById('domainProtocol');
  protocolInput.value = currentProtocol.replace(/:$/, '');
  resizeProtocolInput();

  document.getElementById('domainInput').value = currentHost;
  updateResetDomainState();
  updateUrlDisplay();
}

// 協定欄位寬度跟著內容走，用離屏元素量實際像素寬（不依賴字型的 ch 單位）
function resizeProtocolInput() {
  const input = document.getElementById('domainProtocol');
  const sizer = document.getElementById('protocolSizer');
  sizer.textContent = input.value || input.placeholder;
  input.style.width = `${Math.min(Math.max(sizer.offsetWidth, 24), 96) + 1}px`;
}

// 顯示 path 並同步 Reset 按鈕狀態
function renderPath() {
  document.getElementById('pathInput').value = currentPath;
  updateResetPathState();
  updateUrlDisplay();
}

// 只有 domain 被改過才能 Reset
function updateResetDomainState() {
  document.getElementById('resetDomain').disabled =
    normalizeHost(currentHost) === normalizeHost(originalHost) &&
    currentProtocol === originalProtocol;
}

// 只有 path 被改過才能 Reset
function updateResetPathState() {
  document.getElementById('resetPath').disabled =
    normalizePath(currentPath) === normalizePath(originalPath);
}

// ---- 區塊收合 ----

function loadCollapsedSections() {
  try {
    return new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY)) || []);
  } catch (error) {
    return new Set();
  }
}

function saveCollapsedSections(collapsed) {
  try {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...collapsed]));
  } catch (error) {
    // 無法寫入時僅影響下次開啟的預設狀態，不中斷操作
  }
}

function setupCollapsibleSections() {
  const collapsed = loadCollapsedSections();

  document.querySelectorAll('.edit-section').forEach((section) => {
    const toggle = section.querySelector('.section-toggle');

    const apply = (isCollapsed) => {
      section.classList.toggle('collapsed', isCollapsed);
      toggle.setAttribute('aria-expanded', String(!isCollapsed));
    };

    apply(collapsed.has(section.id));

    toggle.addEventListener('click', () => {
      const isCollapsed = !section.classList.contains('collapsed');
      apply(isCollapsed);

      if (isCollapsed) {
        collapsed.add(section.id);
      } else {
        collapsed.delete(section.id);
      }
      saveCollapsedSections(collapsed);
    });
  });
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

  // 純視覺的分隔線，樣式在 CSS
  const separator = document.createElement('span');
  separator.className = 'param-separator';

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

// 設定事件監聽器
function setupEventListeners() {
  // 編輯協定
  const protocolInput = document.getElementById('domainProtocol');
  protocolInput.addEventListener('input', (e) => {
    currentProtocol = normalizeProtocol(e.target.value);
    resizeProtocolInput();
    updateResetDomainState();
    updateUrlDisplay();
  });

  // 離開輸入框時把顯示值正規化（小寫、去掉多打的冒號與斜線）
  protocolInput.addEventListener('blur', () => {
    if (isProtocolValid(currentProtocol)) {
      renderDomain();
    }
  });

  // 編輯 domain
  const domainInput = document.getElementById('domainInput');
  domainInput.addEventListener('input', (e) => {
    const typed = e.target.value;
    const protocolMatch = typed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*:)\/\//);

    // 貼上完整網址時，把協定拉到協定欄位、host 欄位只留 host
    if (protocolMatch) {
      currentProtocol = normalizeProtocol(protocolMatch[1]);
      currentHost = normalizeHost(typed);
      renderDomain();
      return;
    }

    currentHost = typed;
    updateResetDomainState();
    updateUrlDisplay();
  });

  // 離開輸入框時清掉多餘的路徑片段
  domainInput.addEventListener('blur', () => {
    if (isHostValid(currentHost)) {
      currentHost = normalizeHost(currentHost);
      renderDomain();
    }
  });

  // 還原原始 domain
  document.getElementById('resetDomain').addEventListener('click', () => {
    currentProtocol = originalProtocol;
    currentHost = originalHost;
    renderDomain();
    showToast('Domain restored');
  });

  // 編輯 path
  const pathInput = document.getElementById('pathInput');
  pathInput.addEventListener('input', (e) => {
    currentPath = e.target.value;
    updateResetPathState();
    updateUrlDisplay();
  });

  // 離開輸入框時補上開頭的斜線
  pathInput.addEventListener('blur', () => {
    currentPath = normalizePath(currentPath);
    renderPath();
  });

  // 還原原始 path
  document.getElementById('resetPath').addEventListener('click', () => {
    currentPath = originalPath;
    renderPath();
    showToast('Path restored');
  });

  // 複製網址
  document.getElementById('copyUrl').addEventListener('click', () => {
    navigator.clipboard.writeText(buildUrl()).then(() => {
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
  document.getElementById('refreshBtn').addEventListener('click', applyUrl);

  // 在輸入框按 Enter 直接套用
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      applyUrl();
    }
  });
}

// 套用新網址到當前分頁
async function applyUrl() {
  if (!isProtocolValid(currentProtocol)) {
    showToast('Invalid protocol');
    return;
  }

  if (!isHostValid(currentHost)) {
    showToast('Invalid domain');
    return;
  }

  try {
    const newUrl = buildUrl();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.update(tab.id, { url: newUrl });
    window.close();
  } catch (error) {
    console.error('Apply failed:', error);
    alert('Apply failed. Please check the URL is valid.');
  }
}
