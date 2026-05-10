// js/search.js - 全网盘搜 完整功能
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
        if (isNaN(d.getTime())) return dateStr.split('T')[0];
        return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
    } catch(e) { return dateStr; }
}

function renderCard(item) {
    const title = item.note || '无标题资源';
    const url = item.url || '#';
    const password = item.password || '';
    const source = item.source || '未知来源';
    const datetime = item.datetime ? formatDate(item.datetime) : '时间未知';
    const noteDetail = item.note || '';
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
            ${noteDetail && noteDetail !== title ? `<div class="note">📄 ${escapeHtml(noteDetail.substring(0, 180))}${noteDetail.length > 180 ? '…' : ''}</div>` : ''}
            <div style="display:flex; gap:8px; margin-top:12px;">
                <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="link-btn" style="background:#10b981;">🌐 直接打开</a>
                <a href="${escapeHtml(getProxiedUrl(url))}" target="_blank" rel="noopener noreferrer" class="link-btn" style="background:var(--accent-color);">🚀 代理打开</a>
            </div>
        </div>
        <div class="footer-info">
            <span>✨ 来源: ${escapeHtml(source)}</span>
            ${password ? `<span>🔐 密码: ${escapeHtml(password)}</span>` : '<span>🔓 无密码</span>'}
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

    // 绑定搜索事件
    setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        searchBtn.addEventListener('click', () => searchResources(searchInput.value));
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchResources(searchInput.value);
            }
        });
    }, 100);
};

async function searchResources(keyword) {
    if (!keyword || keyword.trim() === '') {
        document.getElementById('statsArea').innerText = '⚠️ 请输入搜索关键词';
        document.getElementById('resultsContainer').innerHTML = `<div class="empty-state">📌 请输入电影/剧集/资源名称</div>`;
        return;
    }

    const kw = keyword.trim();
    const stats = document.getElementById('statsArea');
    const container = document.getElementById('resultsContainer');

    if (cache.has(kw)) {
        const cached = cache.get(kw);
        stats.innerHTML = `⚡ 缓存命中 · 瞬间展示 ${cached.total} 条结果 · ${currentProxyName}`;
        renderResults(cached.allResults, cached.total, kw);
        return;
    }

    stats.innerHTML = `🚀 ${currentProxyName} 请求中 · 关键词: ${kw}`;
    container.innerHTML = `<div class="loading"><div class="spinner"></div><div>搜索中...</div></div>`;

    try {
        const apiUrl = buildApiUrl(kw);
        const data = await fetchWithTimeout(apiUrl, 8000, 2);

        if (data.code !== 0 || !data.data) throw new Error(data.message || '接口返回数据异常');

        const mergedByType = data.data.merged_by_type || {};
        let allResults = [];
        for (let type in mergedByType) {
            if (Array.isArray(mergedByType[type])) allResults = allResults.concat(mergedByType[type]);
        }

        if (allResults.length === 0) {
            showEmpty(kw);
            return;
        }

        const total = data.data.total || allResults.length;
        cache.set(kw, { allResults, total });
        if (cache.size > 50) cache.delete(cache.keys().next().value);

        stats.innerHTML = `✅ 找到 ${total} 条资源 · ${currentProxyName} (已缓存，下次秒开)`;
        renderResults(allResults, total, kw);
    } catch (err) {
        console.error('搜索出错:', err);
        if (err.name === 'AbortError') {
            showError('请求超时 (8秒)，请切换代理或使用“无代理”模式');
        } else {
            showError(err.message || '网络错误或代理不可用');
        }
    }
}

function showLoading() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `<div class="loading"><div class="spinner"></div><div style="margin-top:12px;">🚀 ${currentProxyName} 请求中...</div></div>`;
}

function showError(msg) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `<div class="error-state">⚠️ 请求失败: ${escapeHtml(msg)}<br><br>💡 提示: 可切换代理或使用“无代理”模式重试</div>`;
    document.getElementById('statsArea').innerText = `❌ 请求失败: ${msg}`;
}

function showEmpty(keyword) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `<div class="empty-state">😞 未找到关于 “${escapeHtml(keyword)}” 的资源<br>试试其他关键词</div>`;
    document.getElementById('statsArea').innerText = `🔍 没有找到与 “${keyword}” 相关的结果`;
}

function renderResults(allResults, total, kw) {
    currentAllResults = [...allResults];
    activeFilter = null;
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `<div class="results-title">📦 搜索结果（按网盘来源自动分类统计 · 点击分类直达）</div>`;

    // 来源统计
    const counts = {};
    allResults.forEach(item => {
        const type = getDiskType(item.url || '#');
        counts[type] = (counts[type] || 0) + 1;
    });

    const statsDiv = document.createElement('div');
    statsDiv.className = 'source-stats';
    Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.style.cursor = 'pointer';
        badge.innerHTML = `${type} <strong>(${count})</strong>`;
        badge.onclick = () => { activeFilter = type; renderCurrentResults(); };
        statsDiv.appendChild(badge);
    });
    container.appendChild(statsDiv);

    renderCurrentResults();
}

function renderCurrentResults() {
    const container = document.getElementById('resultsContainer');
    const existingGrid = container.querySelector('.results-grid');
    if (existingGrid) existingGrid.remove();

    const grid = document.createElement('div');
    grid.className = 'results-grid';
    const toRender = activeFilter ? currentAllResults.filter(item => getDiskType(item.url || '#') === activeFilter) : currentAllResults;
    toRender.forEach(item => grid.insertAdjacentHTML('beforeend', renderCard(item)));
    container.appendChild(grid);
}

window.clearFilter = function() {
    activeFilter = null;
    renderCurrentResults();
};

// fetchWithTimeout 函数（原始代码中有）
async function fetchWithTimeout(url, timeout = 8000, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (err) {
            if (i === retries) throw err;
            await new Promise(r => setTimeout(r, 600));
        }
    }
}
