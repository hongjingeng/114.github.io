export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 定义 KV 绑定
    const FOTV_CHANNELS = env.CHANNELS; // 原有的 FOTV 频道
    const TV_CHANNELS = env.TV_CHANNELS; // 新增的 TV 频道

    // 通用 HTML 头部
    const getHtmlHead = (title) => `
      <!DOCTYPE html>
      <html lang="zh">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; background:#1a1a1a; color:#fff; padding:20px; }
          .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
          .nav-link { color:#4ea3ff; text-decoration:none; font-size:16px; background:#333; padding:8px 15px; border-radius:5px; }
          .channel-list { display:flex; flex-wrap:wrap; gap:15px; }
          .channel-card { background:#333; border-radius:10px; padding:15px; width:180px; text-align:center; }
          .channel-card img { width:80px; height:80px; object-fit:contain; margin-bottom:10px; }
          .channel-card a { color:#4ea3ff; text-decoration:none; font-size:16px; font-weight:bold; }
          .lines { margin-top:10px; }
          .line-btn { display:inline-block; margin:2px; padding:4px 8px; background:transparent; border:1px solid #4ea3ff; color:#4ea3ff; border-radius:4px; font-size:12px; text-decoration:none; }
          .line-btn:hover { background:#4ea3ff; color:#000; }
          .footer { margin-top:40px; text-align:center; font-size:13px; color:#666; }
        </style>
      </head>
      <body>
    `;

    // 通用 HTML 底部
    const getHtmlFooter = () => `
      <div class="footer">© 2026 我的 IPTV · 仅供学习交流</div>
      </body></html>
    `;

    // 渲染频道列表的通用函数
    const renderChannels = (channels) => {
      let html = '';
      for (const id in channels) {
        const ch = channels[id];
        html += `<div class="channel-card">
          <img src="${ch.logo}" alt="${ch.name}">
          <a href="#">${ch.name}</a>
          <div class="lines">`;
        ch.urls.forEach((u, i) => {
          html += `<a class="line-btn" href="${u}" target="_blank">${i + 1}</a>`;
        });
        html += `</div></div>`;
      }
      return html;
    };

    // ===== 首页：FOTV 频道 =====
    if (path === "/" || path === "/index.html") {
      const fotvChannels = await FOTV_CHANNELS.get("channels", { type: "json" }) || {};
      let html = getHtmlHead("FOTV");
      html += `<div class="header"><h1>📺 FOTV</h1><a href="/tv" class="nav-link">TV ▶</a></div>`;
      html += `<div class="channel-list">${renderChannels(fotvChannels)}</div>`;
      html += getHtmlFooter();
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // ===== TV 页面 =====
    if (path === "/tv") {
      const tvChannels = await TV_CHANNELS.get("channels", { type: "json" }) || {};
      let html = getHtmlHead("TV Channels");
      html += `<div class="header"><a href="/" class="nav-link">◀ FOTV</a><h1>📡 TV</h1></div>`;
      html += `<div class="channel-list">${renderChannels(tvChannels)}</div>`;
      html += getHtmlFooter();
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return new Response("Not Found", { status: 404 });
  }
};
