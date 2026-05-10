// js/search.js
let currentProxyBase = 'none';
let currentProxyName = '🌐 无代理（直接访问 · 最快）';
let currentAllResults = [];
let activeFilter = null;
const cache = new Map();

const ORIGIN_API = 'https://so.252035.xyz/api/search?kw=';

function buildApiUrl(keyword) {
    const encodedKw = encodeURIComponent(keyword);
    const originFull = ORIGIN_API + encodedKw;
    if (currentProxyBase === 'none') return originFull;
    return currentProxyBase + originFull;
}

function getProxiedUrl(targetUrl) {
    const proxy = currentProxyBase === 'none' ? 'https://proxy.api.030101.xyz/' : currentProxyBase;
    return proxy + targetUrl;
}

window.changeProxy = function() {
    const select = document.getElementById('proxySelect');
    currentProxyBase = select.value;
    currentProxyName = select.options[select.selectedIndex].text;
    const stats = document.getElementById('statsArea');
    stats.innerHTML = `✨ 已切换至 <strong>${currentProxyName}</strong>`;
};

function getDiskType(url) {
    if (!url) return '🔗 未知';
    if (url.startsWith('magnet:')) return '🧲 磁力链接';
    if (url.includes('115.com') || url.includes('115yun')) return '📦 115网盘';
    if (url.includes('pan.baidu.com')) return '📀 百度网盘';
    if (url.includes('aliyundrive.com')) return '☁️ 阿里云盘';
    if (url.includes('quark.cn')) return '⚛️ 夸克网盘';
    if (url.includes('xunlei.com')) return '⚡ 迅雷网盘';
    return '🔗 其他网盘';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
}

function formatDate(dateStr) {
    if (!dateStr || dateStr.startsWith('0001-01-01')) return '时间未知';
    try {
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
    } catch(e) { return dateStr; }
}

function renderCard(item) {
    const title = item.note || '无标题资源';
    const url = item.url || '#';
    const password = item.password || '';
    const source = item.source || '未知来源';
    const datetime = formatDate(item.datetime);
    const diskType = getDiskType(url);

    return `
    <div class="card">
        <div class="card-content">
            <div class="resource-title">${escapeHtml(title)}</div>
            <div class="meta-info">
                <span class="badge">${diskType}</span>
                <span class="badge">📅 ${datetime}</span>
                <span class="badge">📡 ${escapeHtml(source)}</span>
                ${password ? `<span class="badge password-badge">🔑 提取码: ${escapeHtml(password)}</span>` : ''}
            </div>
            <div style="display:flex; gap:8px; margin-top:12px;">
                <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="link-btn" style="background:#10b981;">🌐 直接打开</a>
                <a href="${escapeHtml(getProxiedUrl(url))}" target="_blank" rel="noopener noreferrer" class="link-btn" style="background:var(--accent-color);">🚀 代理打开</a>
            </div>
        </div>
    </div>`;
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
            <div id="statsArea" class="stats">✨ 114.ae多代理加速已启用 · 点击按钮开始搜索</div>
        </div>
        <div class="results-container">
            <div class="results-title" id="resultsTitle">📦 搜索结果（按网盘来源自动分类统计 · 点击分类直达）</div>
            <div id="resultsContainer"></div>
        </div>
    </div>`;

    document.getElementById('contentContainer').innerHTML = html;

    setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        searchBtn.addEventListener('click', () => searchResources(searchInput.value));
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') searchResources(searchInput.value);
        });
    }, 100);
};

async function searchResources(keyword) {
    if (!keyword || keyword.trim() === '') return;

    const kw = keyword.trim();
    const container = document.getElementById('resultsContainer');
    const stats = document.getElementById('statsArea');

    container.innerHTML = `<div class="loading"><div class="spinner"></div><div>🚀 ${currentProxyName} 请求中...</div></div>`;

    try {
        const apiUrl = buildApiUrl(kw);
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.code !== 0) throw new Error(data.message || '接口异常');

        let allResults = [];
        const mergedByType = data.data.merged_by_type || {};
        for (let type in mergedByType) {
            if (Array.isArray(mergedByType[type])) {
                allResults = allResults.concat(mergedByType[type]);
            }
        }

        renderResults(allResults);
    } catch (err) {
        container.innerHTML = `<div class="error-state">⚠️ 请求失败，请切换代理或使用无代理模式重试</div>`;
    }
}

function renderResults(allResults) {
    currentAllResults = allResults;
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '<div class="results-grid"></div>';
    const grid = container.querySelector('.results-grid');

    allResults.forEach(item => {
        grid.innerHTML += renderCard(item);
    });
}
