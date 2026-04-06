export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ==================== KV 绑定定义（修正大小写）====================
    // 对应后台 Variable name: CHANNELS -> Namespace: IPTV_CHANNEL_DATA
    const FOTV_CHANNELS = env.CHANNELS; 
    // 对应后台 Variable name: TV -> Namespace: IPTV_CHANNEL_DATA
    const TV_CHANNELS = env.CHANNELS; 

    // ==================== HTML 基础模板（保持不变）====================
    const getHtmlHead = (title) => `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; background: #1a1a1a; color: #fff; padding: 20px; }
          .container { max-width: 1400px; margin: 0 auto; }
          header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 15px; margin-bottom: 20px; }
          h1 { margin: 0; font-size: 24px; }
          .nav-link { color: #4ea3ff; text-decoration: none; background: #2c2c2c; padding: 8px 16px; border-radius: 6px; font-size: 14px; }
          .channel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
          .channel-card { background: #2c2c2c; border-radius: 10px; padding: 15px; text-align: center; }
          .channel-card img { width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px; }
          .channel-name { font-weight: bold; margin-bottom: 10px; display: block; }
          .line-buttons a { display: inline-block; margin: 3px; padding: 4px 8px; border: 1px solid #4ea3ff; color: #4ea3ff; border-radius: 4px; font-size: 12px; text-decoration: none; }
          .line-buttons a:hover { background: #4ea3ff; color: #000; }
          footer { margin-top: 40px; text-align: center; font-size: 13px; color: #666; }
        </style>
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

    // ==================== 渲染频道列表的函数 ====================
    const renderChannels = (channels) => {
      if (!channels || typeof channels !== 'object') {
        return '<p>⚠️ 未找到频道数据，请检查 KV 绑定和 Key 是否正确。</p>';
      }
      let html = '<div class="channel-grid">';
      for (const id in channels) {
        const ch = channels[id];
        if (!ch || !Array.isArray(ch.urls)) continue;
        html += `
          <div class="channel-card">
            <img src="${ch.logo}" alt="${ch.name}" onerror="this.src='https://via.placeholder.com/80'">
            <span class="channel-name">${ch.name}</span>
            <div class="line-buttons">
        `;
        ch.urls.forEach((u, i) => {
          html += `<a href="${u}" target="_blank">线路 ${i + 1}</a>`;
        });
        html += `</div></div>`;
      }
      html += '</div>';
      return html;
    };

    // ==================== 路由逻辑 ====================
    try {
      // --- 首页：FOTV 频道 ---
      if (path === "/" || path === "/index.html") {
        // ✅ 读取 Key: CHANNELS
        const fotvChannels = await FOTV_CHANNELS.get("CHANNELS", { type: "json" }) || {};
        let html = getHtmlHead("FOTV");
        html += `<h1>📺 FOTV</h1><a href="/tv" class="nav-link">TV ▶</a></header>`;
        html += renderChannels(fotvChannels);
        html += getHtmlFooter();
        return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }

      // --- TV 页面 ---
      if (path === "/tv") {
        // ✅ 读取 Key: CHANNELS
        const tvChannels = await TV_CHANNELS.get("TV", { type: "json" }) || {};
        let html = getHtmlHead("TV Channels");
        html += `<a href="/" class="nav-link">◀ FOTV</a><h1>📡 TV</h1></header>`;
        html += renderChannels(tvChannels);
        html += getHtmlFooter();
        return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }

      return new Response("Not Found", { status: 404 });

    } catch (e) {
      // 捕获并返回具体错误信息，方便最终调试
      return new Response(`Worker Error: ${e.message}`, { status: 500 });
    }
  }
};
