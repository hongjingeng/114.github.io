// js/main.js
let currentTab = 0;
const tabs = [
    { id: 0, name: "🔍 全网盘搜", file: "search.js", containerId: "search-content" },
    { id: 1, name: "✉️ 临时邮箱", file: "email.js", containerId: "email-content" },
    { id: 2, name: "💱 汇率查询", file: "exchange.js", containerId: "exchange-content" },
    { id: 3, name: "🔍 域名查询", file: "domain.js", containerId: "domain-content" },
    { id: 4, name: "🎵 在线音乐", file: "music.js", containerId: "music-content" }
];

let loadedScripts = new Set();

async function loadScript(src) {
    if (loadedScripts.has(src)) return;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => { loadedScripts.add(src); resolve(); };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function renderTabs() {
    const bar = document.getElementById('tabBar');
    bar.innerHTML = tabs.map(tab => `
        <button class="tab ${tab.id === currentTab ? 'active' : ''}" 
                onclick="switchTab(${tab.id})">
            ${tab.name}
        </button>
    `).join('');
}

window.switchTab = async function(n) {
    currentTab = n;
    renderTabs();

    const tab = tabs[n];
    const container = document.getElementById('contentContainer');

    // 加载对应 JS（会自动创建内容）
    await loadScript(`js/${tab.file}`);

    // 如果有 init 函数则执行
    if (typeof window[`init${tab.containerId.replace('-content','').replace(/^\w/, c => c.toUpperCase())}`] === 'function') {
        window[`init${tab.containerId.replace('-content','').replace(/^\w/, c => c.toUpperCase())}`]();
    }
};

// 默认显示域名查询（可修改）
const defaultTab = 3;   // 0=搜索, 1=邮箱, 2=汇率, 3=域名, 4=音乐

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    renderTabs();
    switchTab(defaultTab);   // 默认显示域名查询

    // 广告加载（保持原逻辑）
    loadAds();
});

async function loadAds() {
    // 1200x70 图片广告
    const adContainer = document.getElementById('ad-1200x70');
    // ... 保持你原来的广告加载代码 ...
}
