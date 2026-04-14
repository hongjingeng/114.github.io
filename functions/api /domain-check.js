/**
 * Cloudflare Pages Functions
 * 文件路径：functions/api/domain-check.js
 * 访问路径：/api/domain-check
 */

export async function onRequestPost(context) {
  try {
    // 1. 解析前端发送过来的 JSON 数据
    const body = await context.request.json();

    // 2. 向真实的 API 发起请求（此地址在 Worker 后端，对用户不可见）
    const apiResponse = await fetch("https://apihk.114.ae/api/domain-check.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // 3. 将真实 API 的响应数据返回给前端
    const data = await apiResponse.json();
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    // 4. 错误处理
    return new Response(
      JSON.stringify({ error: "API proxy failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
