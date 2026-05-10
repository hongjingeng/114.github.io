// js/search.js
let currentProxyBase = 'none';
let currentProxyName = '🌐 无代理（直接访问 · 最快）';
let currentAllResults = [];

const ORIGIN_API = 'https://so.252035.xyz/api/search?kw=';
const cache = new Map();

function buildApiUrl(keyword) {
    const encoded = encodeURIComponent(keyword);
    return currentProxyBase === 'none' ? ORIGIN_API + encoded : currentProxyBase + ORIGIN_API + encoded;
}

window.changeProxy = function() {
    const select = document.getElementById('proxySelect');
    currentProxyBase = select.value;
    currentProxyName = select.options[select.selectedIndex].text;
    document.getElementById('statsArea').innerHTML = `✨ 已切换至 <strong>${currentProxyName}</strong>`;
};

function getDiskType(url) {
    if (!url) return '🔗 未知';
    if (url.startsWith('magnet:')) return '🧲 磁力链接';
    if (url.includes('115.com')) return '📦 115网盘';
    if (url.includes('pan.baidu.com')) return '📀 百度网盘';
    if (url.includes('aliyundrive.com')) return '☁️ 阿里云盘';
    if (url.includes('quark.cn')) return '⚛️ 夸克网盘';
    return '🔗 其他网盘';
}

function escapeHtml(str) {
    return str ? str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])) : '';
}

function formatDate(dateStr) {
    if (!dateStr) return '未知';
    try {
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
    } catch(e) { return dateStr; }
}

window.initSearch = function() {
    const html = `
    <div id="search-content">
        <div class="search-header">
            <div class="avatar-wrapper"><div class="avatar">🛸</div></div>
            <h1>114全网盘搜</h1>
            <p class="sub">🚀 114.ae跨境 · 多代理加速 · 智能缓存 · 瞬时响应</p>
            <div class="proxy-select">
                <select id="proxySelect" onchange="changeProxy()">
                    <option value="none" selected>🌐 无代理（直接访问 · 最快）</option>
                    <option value="https://proxy.api.030101.xyz/">🚀 推荐代理1（030101 · 最稳定）</option>
                </select>
            </div>
            <div class="search-box">
                <input type="text" id="searchInput" class="search-input" placeholder="输入电影、剧集、短剧、书籍、音乐、软件、资料">
                <button id="searchBtn" class="search-btn">🔍 极速搜索</button>
            </div>
            <div id="statsArea" class="stats">✨ 点击按钮开始搜索</div>
        </div>
        <div class="results-container">
            <div class="results-title">📦 搜索结果</div>
            <div id="resultsContainer"></div>
        </div>
    </div>`;

    document.getElementById('contentContainer').innerHTML = html;

    setTimeout(() => {
        const input = document.getElementById('searchInput');
        const btn = document.getElementById('searchBtn');
        btn.onclick = () => searchResources(input.value);
        input.onkeypress = (e) => { if (e.key === 'Enter') searchResources(input.value); };
    }, 150);
};

async function searchResources(keyword) {
    if (!keyword?.trim()) return;
    const kw = keyword.trim();
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `<div class="loading"><div class="spinner"></div><div>🚀 搜索中...</div></div>`;

    try {
        const res = await fetch(buildApiUrl(kw));
        const data = await res.json();
        let allResults = [];
        if (data.data?.merged_by_type) {
            Object.values(data.data.merged_by_type).forEach(arr => allResults = allResults.concat(arr || []));
        }
        renderSearchResults(allResults);
    } catch (e) {
        container.innerHTML = `<div class="error-state">⚠️ 请求失败，请切换代理重试</div>`;
    }
}

function renderSearchResults(results) {
    const container = document.getElementById('resultsContainer');
    let html = '<div class="results-grid">';
    results.forEach(item => {
        html += `
        <div class="card">
            <div class="card-content">
                <div class="resource-title">${escapeHtml(item.note || item.title || '资源')}</div>
                <div class="meta-info">
                    <span class="badge">${getDiskType(item.url)}</span>
                    <span class="badge">📅 ${formatDate(item.datetime)}</span>
                </div>
                <div style="display:flex;gap:8px;margin-top:12px;">
                    <a href="${item.url}" target="_blank" class="link-btn" style="background:#10b981;">🌐 直接打开</a>
                    <a href="${item.url}" target="_blank" class="link-btn" style="background:var(--accent-color);">🚀 代理打开</a>
                </div>
            </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}
