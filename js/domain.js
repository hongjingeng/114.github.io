// js/domain.js - 完整域名查询功能
const domainTranslations = {
    zh: { title:"114.ae 域名查询", placeholder:"输入域名(不带后缀)", copyright:"© 2026 www.114.ae 域名查询 · 保留所有权利" },
    en: { title:"114.ae Domain Search", placeholder:"Enter domain without suffix", copyright:"© 2026 114.ae Domain Search · All rights reserved" },
    ar: { title:"بحث عن النطاق", placeholder:"أدخل النطاق بدون اللاحقة", copyright:"© 2026 بحث النطاقات · جميع الحقوق محفوظة" }
};

let currentDomainLang = "zh";

window.switchDomainLang = function(lang, el) {
    currentDomainLang = lang;
    document.getElementById("domain-title").innerText = domainTranslations[lang].title;
    document.getElementById("domain-input").placeholder = domainTranslations[lang].placeholder;
    document.getElementById("domain-copyright").innerText = domainTranslations[lang].copyright;
    document.querySelectorAll('#domain-content .lang-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
};

function detectDomainDevice() {
    const ua = navigator.userAgent;
    const device = /Mobi|Android/i.test(ua) ? "移动设备" : "PC";
    document.getElementById("domain-deviceInfo").innerText = "当前访问设备：" + device;
}

window.initDomain = function() {
    const html = `
    <div id="domain-content">
        <div class="domain-container">
            <div class="marquee"><marquee>当前要出售的域名 →→→ uda.ae →→→ wemart.ae →→→ alipay.ae 需要买的带价格来谈 联系微信: jingeng</marquee></div>
            <h1 id="domain-title">114.ae 域名查询</h1>
            <div>
                <input id="domain-input" placeholder="输入域名(不带后缀)" style="width:70%;padding:14px;font-size:16px;border:1px solid var(--border-color);border-radius:8px;">
                <br><br>
                <button onclick="checkDomains()" style="padding:14px 22px;font-size:16px;background:var(--accent-color);color:white;border:none;border-radius:8px;cursor:pointer;">查询</button>
            </div>
            <div style="margin-top:10px;">
                <span class="lang-btn active" onclick="switchDomainLang('zh',this)">中文</span>
                <span class="lang-btn" onclick="switchDomainLang('en',this)">English</span>
                <span class="lang-btn" onclick="switchDomainLang('ar',this)">عربي</span>
            </div>
            <div id="domain-deviceInfo" style="margin:15px 0; font-size:14px; color:var(--text-secondary);"></div>
            <div id="domain-output" style="margin-top:20px; overflow-x:auto;"></div>
            <div style="margin-top:15px;">
                <button onclick="copyDomainResults()" style="padding:10px 20px;margin:5px;">复制结果</button>
                <button onclick="shareDomainResults()" style="padding:10px 20px;margin:5px;">转发结果</button>
            </div>
            <div id="domain-copyright" class="copyright" style="margin-top:20px;font-size:14px;color:var(--text-secondary);">© 2026 www.114.ae 域名查询 · 广告 👉 微信：jingeng</div>
        </div>
    </div>`;

    document.getElementById('contentContainer').innerHTML = html;
    detectDomainDevice();
};

window.checkDomains = async function() {
    const input = document.getElementById("domain-input").value.trim();
    const out = document.getElementById("domain-output");
    if (!input) {
        alert(domainTranslations[currentDomainLang].placeholder);
        return;
    }
    out.innerHTML = "<div class='loading'>查询中...</div>";
    try {
        const res = await fetch("https://apiforaereg.114.ae/api/aedomain-check.php", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                domains: [input],
                tlds: [".ae", ".bh", ".qa", ".ac.ae", ".org.ae", ".sch.ae", ".co.ae"]
            })
        });
        const data = await res.json();
        if (data.error) {
            out.innerHTML = data.error;
            return;
        }
        let html = `<table style="width:100%;border-collapse:collapse;"><tr><th>域名Domain</th><th>状态Status</th><th>注册Reg/续费Renew价格(AED) /Year </th></tr>`;
        for (let d of data) {
            const statusText = d.isAvailable ? "✅ 未注册available，联系微信注册：jingeng" : "❌ 已注册not-available";
            html += `<tr><td>${d.domain}</td><td class="${d.isAvailable ? 'not-available' : 'available'}">${statusText}</td><td>${d.regPrice} / ${d.renewPrice}</td></tr>`;
        }
        html += `</table>`;
        out.innerHTML = html;
    } catch(e) {
        out.innerHTML = "查询失败，请稍后再试";
    }
};

window.copyDomainResults = function() {
    const text = document.getElementById("domain-output").innerText;
    navigator.clipboard.writeText(text).then(() => alert("复制成功"));
};

window.shareDomainResults = function() {
    const text = document.getElementById("domain-output").innerText;
    if (navigator.share) {
        navigator.share({title: "114.ae 域名查询结果", text: text});
    } else {
        navigator.clipboard.writeText(text).then(() => alert("已复制，可粘贴到微信 / WhatsApp / TG"));
    }
};
