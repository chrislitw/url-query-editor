let currentUrl = '';
let currentParams = new Map();
// 網址欄只放 query 之前的部分（協定、網域、路徑），query 由參數列表管理
let currentBase = '';
let originalBase = '';
let originalHash = '';

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentUrl();
  renderBase();
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

      // 解析 query 之前的網址與 hash
      originalBase = stripQuery(url);
      originalHash = url.hash;
      currentBase = originalBase;

      // 解析 query 參數
      currentParams.clear();
      url.searchParams.forEach((value, key) => {
        currentParams.set(key, value);
      });

      updateParamCount();
    }
  } catch (error) {
    console.error('Failed to load URL:', error);
    showToast('Unable to load current page URL');
  }
}

// 更新參數數量顯示
function updateParamCount() {
  const badge = document.getElementById('paramCount');
  const n = currentParams.size;
  badge.textContent = `${n} ${n === 1 ? 'param' : 'params'}`;
}

// 去掉 query 與 hash，只留協定、網域與路徑
function stripQuery(url) {
  const copy = new URL(url);
  copy.search = '';
  copy.hash = '';
  return copy.href;
}

// 網址欄接受的協定；其他協定（例如打錯的 htps:）一律視為不合法
const KNOWN_PROTOCOLS = [
  'http:', 'https:', 'ws:', 'wss:', 'ftp:', 'file:',
  'chrome:', 'chrome-extension:', 'edge:', 'about:', 'data:', 'view-source:',
];

// 需要 host 的協定，而且必須寫成 scheme://host 的形式
const HOST_REQUIRED = ['http:', 'https:', 'ws:', 'wss:', 'ftp:'];

// Chrome 的 URL 解析很寬鬆（abc 會變成 https://abc/、空白會被編碼成 %20），
// 所以另外要求 host 必須是 localhost、IP，或帶有英文頂級網域的網域名稱
// （中文網域會先被轉成 xn-- 開頭的 punycode）
const LABEL = '[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?';
const DOMAIN_PATTERN = new RegExp(`^(?:${LABEL}\\.)+(?:[a-z]{2,}|xn--[a-z0-9-]+)\\.?$`, 'i');
const IPV4_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/;
const IPV6_PATTERN = /^\[[0-9a-f:.]+\]$/i;

function isHostValid(hostname) {
  return hostname === 'localhost'
    || DOMAIN_PATTERN.test(hostname)
    || IPV4_PATTERN.test(hostname)
    || IPV6_PATTERN.test(hostname);
}

// 解析網址欄；沒打協定時沿用原本的協定，不合法時回傳 null
function parseBase(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const scheme = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  // localhost:3000、192.168.1.10:8080 這類 host:port 不是協定
  const isHostPort = /^[^/:?#]+:\d+([/?#]|$)/.test(trimmed);

  let candidate = trimmed;
  if (!scheme || isHostPort) {
    const protocol = originalBase ? new URL(originalBase).protocol : 'https:';
    candidate = `${protocol}//${trimmed}`;
  }

  let url;
  try {
    url = new URL(candidate);
  } catch (error) {
    return null;
  }

  if (!KNOWN_PROTOCOLS.includes(url.protocol)) return null;

  if (HOST_REQUIRED.includes(url.protocol)) {
    // https:/example.com 這種少一條斜線的寫法，Chrome 會自動補正，這裡視為打錯
    if (!candidate.toLowerCase().startsWith(`${url.protocol}//`)) return null;
    if (!isHostValid(url.hostname)) return null;
  }

  return url;
}

// 根據網址欄與參數組裝新網址
function buildUrl() {
  const url = parseBase(currentBase);
  if (!url) throw new Error('Invalid URL');

  url.search = '';
  currentParams.forEach((value, key) => {
    if (key.trim()) {
      url.searchParams.set(key, value);
    }
  });
  url.hash = originalHash;
  return url.toString();
}

// 即時更新網址欄的完整網址提示與驗證狀態
function updateUrlDisplay() {
  const field = document.getElementById('urlField');
  try {
    // 滑鼠停留時顯示含 query 的完整網址
    field.title = buildUrl();
  } catch (error) {
    // 保留上一次的提示，避免輸入過程中暫時無效的狀態閃爍
  }

  // 網址不合法時紅框，並停用 Apply 與複製
  const isValid = Boolean(parseBase(currentBase));
  field.classList.toggle('is-invalid', !isValid);
  document.getElementById('refreshBtn').disabled = !isValid;
  document.getElementById('copyUrl').disabled = !isValid;
}

// 顯示網址欄並同步 Reset 按鈕狀態
function renderBase() {
  document.getElementById('baseInput').value = currentBase;
  resizeBaseInput();
  updateResetState();
  updateUrlDisplay();
}

// 網址欄依內容長高，最多兩行（上限寫在 CSS 的 max-height），超過就在欄位內捲動
function resizeBaseInput() {
  const input = document.getElementById('baseInput');
  input.style.height = 'auto';
  input.style.height = `${input.scrollHeight}px`;
}

// 只有網址被改過才能 Reset
function updateResetState() {
  const parsed = parseBase(currentBase);
  document.getElementById('resetUrl').disabled = Boolean(parsed) && parsed.href === originalBase;
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
  // 編輯網址
  const baseInput = document.getElementById('baseInput');
  baseInput.addEventListener('input', () => {
    // 網址不會有換行，貼上的換行一律去掉
    const text = baseInput.value.replace(/[\r\n]+/g, '');

    // 貼上含 query 的完整網址時，把 query 拆進參數列表
    if (/[?#]/.test(text)) {
      const parsed = parseBase(text);
      if (parsed) {
        currentParams.clear();
        parsed.searchParams.forEach((value, key) => currentParams.set(key, value));
        originalHash = parsed.hash;
        currentBase = stripQuery(parsed);
        renderBase();
        renderParams();
        return;
      }
    }

    currentBase = text;
    if (baseInput.value !== text) baseInput.value = text;
    resizeBaseInput();
    updateResetState();
    updateUrlDisplay();
  });

  // 離開輸入框時把網址正規化（補上協定、網域轉小寫等）
  baseInput.addEventListener('blur', () => {
    const parsed = parseBase(currentBase);
    if (parsed) {
      currentBase = parsed.href;
      renderBase();
    }
  });

  // 還原原始網址
  document.getElementById('resetUrl').addEventListener('click', () => {
    currentBase = originalBase;
    renderBase();
    showToast('URL restored');
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

  // 在輸入框按 Enter 直接套用（網址欄是 textarea，要擋掉換行；輸入法選字時不套用）
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault();
      applyUrl();
    }
  });
}

// 套用新網址到當前分頁
async function applyUrl() {
  if (!parseBase(currentBase)) {
    showToast('Invalid URL');
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
