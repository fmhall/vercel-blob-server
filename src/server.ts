import type { Handler } from './handlers/common.ts';
import copy from './handlers/copy.ts';
import get from './handlers/get.ts';
import del from './handlers/del.ts';
import head from './handlers/head.ts';
import put from './handlers/put.ts';

const handlers: Handler[] = [head, get, copy, put, del];

const port = process.env.PORT ? parseInt(process.env.PORT) : 6969;

console.log(`🚀 Starting Vercel Blob Server...`);
console.log(`📁 Store path: ${process.env.VERCEL_STORE_PATH || 'default'}`);
console.log(`🌐 Port: ${port}`);

const server = Bun.serve({
  port,
  fetch: async (request) => {
    const startTime = Date.now();
    const url = new URL(request.url);
    
    console.log(`📨 ${request.method} ${url.pathname} - ${new Date().toISOString()}`);
    
    try {
      for (let handler of handlers) {
        if (handler.test(url, request)) {
          const response = await handler.handle(url, request);
          const duration = Date.now() - startTime;
          console.log(`✅ ${request.method} ${url.pathname} - ${response.status} (${duration}ms)`);
          return response;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`❌ ${request.method} ${url.pathname} - 404 Not Found (${duration}ms)`);
      return Response.json(null, { status: 404 });
    } catch (e) {
      const duration = Date.now() - startTime;
      console.error(`💥 ${request.method} ${url.pathname} - ERROR (${duration}ms):`, e);
      return new Response(String((e as any)?.message ?? e), { status: 500 });
    }
  },
});

console.log(`✅ Server running on http://localhost:${port}`);
console.log(`🐳 Docker logs enabled - all requests will be logged`);
