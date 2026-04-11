let currentUrl = '';
let currentParams = new Map();

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentUrl();
  renderParams();
  setupEventListeners();
});

// 获取当前标签页的 URL
async function loadCurrentUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      currentUrl = tab.url;
      const url = new URL(currentUrl);

      // 显示当前 URL
      document.getElementById('currentUrl').textContent = currentUrl;

      // 解析 query 参数
      currentParams.clear();
      url.searchParams.forEach((value, key) => {
        currentParams.set(key, value);
      });
    }
  } catch (error) {
    console.error('获取 URL 失败:', error);
    document.getElementById('currentUrl').textContent = '无法获取当前页面 URL';
  }
}

// 渲染参数列表
function renderParams() {
  const paramsList = document.getElementById('paramsList');
  paramsList.innerHTML = '';

  if (currentParams.size === 0) {
    paramsList.innerHTML = '<div class="empty-state">暂无 query 参数，点击上方按钮添加</div>';
    return;
  }

  currentParams.forEach((value, key) => {
    const paramItem = createParamItem(key, value);
    paramsList.appendChild(paramItem);
  });
}

// 创建参数项
function createParamItem(key, value) {
  const div = document.createElement('div');
  div.className = 'param-item';

  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.className = 'param-key';
  keyInput.value = key;
  keyInput.placeholder = '参数名';
  keyInput.dataset.originalKey = key;

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'param-value';
  valueInput.value = value;
  valueInput.placeholder = '参数值';

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn btn-remove';
  removeBtn.textContent = '删除';
  removeBtn.onclick = () => {
    currentParams.delete(key);
    renderParams();
  };

  // 监听输入变化
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

// 设置事件监听器
function setupEventListeners() {
  // 添加参数
  document.getElementById('addParam').addEventListener('click', () => {
    const newKey = `param${currentParams.size + 1}`;
    currentParams.set(newKey, '');
    renderParams();
  });

  // 刷新页面
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    try {
      const url = new URL(currentUrl);

      // 清空原有的 search params
      url.search = '';

      // 添加新的 params
      currentParams.forEach((value, key) => {
        if (key.trim()) {  // 只添加非空的 key
          url.searchParams.set(key, value);
        }
      });

      const newUrl = url.toString();

      // 更新标签页 URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.update(tab.id, { url: newUrl });

      // 关闭弹窗
      window.close();
    } catch (error) {
      console.error('刷新页面失败:', error);
      alert('刷新页面失败，请检查 URL 是否有效');
    }
  });
}
