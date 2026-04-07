export default {
  async fetch(request, env) {

    // ==================== 安全校验 ====================
    const url = new URL(request.url);
    const hostname = url.hostname;
    const referer = request.headers.get("Referer") || "";

    // ✅ 只允许指定域名访问（防刷接口）
    if (
      hostname !== "tv.114.ae" &&
      !hostname.endsWith(".114.ae")
    ) {
      return new Response("Forbidden", { status: 403 });
    }

    // ==================== KV 绑定 ====================
    const CHANNELS_KV = env.CHANNELS;
    const CONFIG      = env.TGIPTV_CONFIG;

    // ==================== 日志 ====================
    const logAccess = async () => {
      try {
        const cfg = await CONFIG.get("app_config", { type: "json" }) || {};
        cfg.stats = cfg.stats || {};
        cfg.stats.total_requests = (cfg.stats.total_requests || 0) + 1;
        await CONFIG.put("app_config", JSON.stringify(cfg));
      } catch {}
    };

    // ==================== TG 通知 ====================
    const sendTG = async (msg) => {
      try {
        const cfg = await CONFIG.get("app_config", { type: "json" });
        if (!cfg?.tg?.bot_token || !cfg?.tg?.chat_id) return;

        await fetch(
          `https://api.telegram.org/bot${cfg.tg.bot_token}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: cfg.tg.chat_id,
              text: msg,
              parse_mode: "HTML"
            })
          }
        );
      } catch {}
    };

    // ==================== HTML（含防查看）====================
    const getHtmlHead = (title) => `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family:sans-serif;
            background:#1a1a1a;
            color:#fff;
            padding:20px;
            user-select:none;
            -webkit-user-select:none;
          }
          .container { max-width:1400px; margin:auto; }
          header { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #444; padding-bottom:15px; margin-bottom:20px; }
          h1 { margin:0; font-size:24px; }
          .nav-link { color:#4ea3ff; text-decoration:none; background:#2c2c2c; padding:8px 16px; border-radius:6px; }
          .channel-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:20px; }
          .channel-card { background:#2c2c2c; border-radius:10px; padding:15px; text-align:center; }
          .channel-card img { width:80px; height:80px; object-fit:contain; margin-bottom:10px; }
          .channel-name { font-weight:bold; margin-bottom:10px; display:block; }
          .line-buttons a { display:inline-block; margin:3px; padding:4px 8px; border:1px solid #4ea3ff; color:#4ea3ff; border-radius:4px; font-size:12px; text-decoration:none; }
          .line-buttons a:hover { background:#4ea3ff; color:#000; }
          footer { margin-top:40px; text-align:center; font-size:13px; color:#666; }
        </style>
        <script>
          // ✅ 禁止右键
          document.addEventListener("contextmenu", e => e.preventDefault());

          // ✅ 禁止选择
          document.addEventListener("selectstart", e => e.preventDefault());

          // ✅ 干扰 F12
          setInterval(() => {
            debugger;
          }, 1000);
        </script>
      </head>
      <body>
        <div class="container">
          <header>
    `;

    const getHtmlFooter = () => `
          </div>
          <footer>© 2026 IPTV Online · 仅供学习交流</footer>
        </body>
      </html>
    `;

    // ==================== 频道渲染 ====================
    const renderChannels = (channels) => {
      if (!channels || typeof channels !== "object") {
        return "<p>⚠️ 未找到频道数据</p>";
      }
      let html = '<div class="channel-grid">';
      for (const id in channels) {
        const ch = channels[id];
        if (!ch || !Array.isArray(ch.urls)) continue;
        html += `
          <div class="channel-card">
            <img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/80'">
            <span class="channel-name">${ch.name}</span>
            <div class="line-buttons">
        `;
        ch.urls.forEach((u, i) => {
          html += `<a href="${u}" target="_blank">线路 ${i + 1}</a>`;
        });
        html += `</div></div>`;
      }
      html += "</div>";
      return html;
    };

    // ==================== 路由逻辑 ====================
    try {
      await logAccess();

      // --- FOTV 首页 ---
      if (url.pathname === "/" || url.pathname === "/index.html") {
        const ip = request.headers.get("CF-Connecting-IP") || "未知 IP";
        const country = request.headers.get("CF-IPCountry") || "未知";
        const region = request.headers.get("CF-Region") || "";
        const city = request.headers.get("CF-City") || "";
        const location = `${country}${region ? " / " + region : ""}${city ? " / " + city : ""}`;

        await sendTG(
          `📺 <b>FOTV 首页被访问</b>
📄 页面：${url.pathname}
🌐 IP：${ip}
📍 归属地：${location}
🕒 时间：${new Date().toLocaleString()}`
        );

        const fotv = await CHANNELS_KV.get("CHANNELS", { type: "json" }) || {};
        let html = getHtmlHead("FOTV");
        html += `<h1>📺 FOTV</h1><a href="/tv" class="nav-link">TV ▶</a></header>`;
        html += renderChannels(fotv);
        html += getHtmlFooter();
        return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }

      // --- TV 页面 ---
      if (url.pathname === "/tv") {
        const ip = request.headers.get("CF-Connecting-IP") || "未知 IP";
        const country = request.headers.get("CF-IPCountry") || "未知";
        const region = request.headers.get("CF-Region") || "";
        const city = request.headers.get("CF-City") || "";
        const location = `${country}${region ? " / " + region : ""}${city ? " / " + city : ""}`;

        try {
          await sendTG(
            `📡 <b>TV 页面被访问</b>
📄 页面：${url.pathname}
🌐 IP：${ip}
📍 归属地：${location}
🕒 时间：${new Date().toLocaleString()}`
          );
        } catch {}

        const tv = await CHANNELS_KV.get("TV", { type: "json" }) || {};
        let html = getHtmlHead("TV Channels");
        html += `<a href="/" class="nav-link">◀ FOTV</a><h1>📡 TV</h1></header>`;
        html += renderChannels(tv);
        html += getHtmlFooter();

        return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }

      return new Response("Not Found", { status: 404 });

    } catch (e) {
      await sendTG("❌ <b>IPTV Worker 错误</b>\n<pre>" + e.stack + "</pre>");
      return new Response("Worker Error: " + e.message, { status: 500 });
    }
  }
};
