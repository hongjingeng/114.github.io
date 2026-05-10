// js/search.js
let currentProxyBase = 'none';
let currentProxyName = '🌐 无代理（直接访问 · 最快）';
let currentAllResults = [];
let activeFilter = null;
const cache = new Map();

const ORIGIN_API = 'https://so.252035.xyz/api/search?kw=';

function buildApiUrl(keyword) {
    const encodedKw = encodeURIComponent(keyword);
    return currentProxyBase === 'none' ? ORIGIN_API + encodedKw : currentProxyBase + ORIGIN_API + encodedKw;
}

function getProxiedUrl(targetUrl) {
    const proxy = currentProxyBase === 'none' ? 'https://proxy.api.030101.xyz/' : currentProxyBase;
    return proxy + targetUrl;
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
                ${password ? `<span class="badge password-badge">🔑 ${escapeHtml(password)}</span>` : ''}
            </div>
            <div style="display:flex; gap:8px; margin-top:12px;">
                <a href="${escapeHtml(url)}" target="_blank" class="link-btn" style="background:#10b981;">🌐 直接打开</a>
                <a href="${escapeHtml(getProxiedUrl(url))}" target="_blank" class="link-btn" style="background:var(--accent-color);">🚀 代理打开</a>
            </div>
        </div>
    </div>`;
}

window.searchResources = async function(keyword) {
    if (!keyword?.trim()) return;
    const kw = keyword.trim();
    const container = document.getElementById('resultsContainer');
    const stats = document.getElementById('statsArea');

    if (cache.has(kw)) {
        renderResults(cache.get(kw));
        return;
    }

    stats.innerHTML = `🚀 ${currentProxyName} 请求中...`;
    container.innerHTML = `<div class="loading"><div class="spinner"></div><div>搜索中...</div></div>`;

    try {
        const res = await fetch(buildApiUrl(kw));
        const data = await res.json();
        if (data.code !== 0) throw new Error('接口异常');

        let allResults = [];
        const merged = data.data.merged_by_type || {};
        Object.values(merged).forEach(arr => allResults = allResults.concat(arr));

        cache.set(kw, allResults);
        renderResults(allResults, kw);
    } catch (e) {
        container.innerHTML = `<div class="error-state">请求失败，请切换代理重试</div>`;
    }
};

function renderResults(allResults, keyword) {
    currentAllResults = allResults;
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'results-grid';
    allResults.forEach(item => grid.innerHTML += renderCard(item));
    container.appendChild(grid);
}

window.initSearch = function() {
    const html = `...（上面我已经给出完整 search-content HTML）...`;
    document.getElementById('contentContainer').innerHTML = html;

    // 绑定事件
    setTimeout(() => {
        const input = document.getElementById('searchInput');
        const btn = document.getElementById('searchBtn');
        btn.onclick = () => window.searchResources(input.value);
        input.onkeypress = e => { if(e.key==='Enter') window.searchResources(input.value); };
    }, 200);
};
