export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 如果是 navibatch.com（不带 www），重定向到 www.navibatch.com
    if (url.hostname === 'navibatch.com') {
      const redirectUrl = `https://www.navibatch.com${url.pathname}${url.search}`;
      console.log(`Redirecting ${url.href} to ${redirectUrl}`);
      return Response.redirect(redirectUrl, 301);
    }
    
    // 其他情况返回 404
    return new Response('Not Found', { status: 404 });
  }
}
