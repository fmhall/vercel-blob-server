import path from 'node:path';
import { defineHandler, storePath } from './common.ts';

export default defineHandler({
  name: 'put',
  test (url: URL, request: Request): boolean {
    return request.method === 'PUT' && !url.searchParams.has('fromUrl');
  },
  async handle (url: URL, request) {
    const contentDisposition = request.headers.get('Content-Disposition') || 'attachment';
    const blob = await request.blob();
    const contentType = blob.type || request.headers.get('X-Content-Type');
    const cacheControlRaw = request.headers.get('x-cache-control-max-age');
    let cacheControl: string | undefined;
    if (cacheControlRaw) {
      cacheControl = `max-age=${cacheControlRaw}`;
    } else {
      cacheControl = 'max-age=31536000';
    }

    // Get pathname from URL path, or fallback to query parameter if path is just "/"
    let pathname = url.pathname;
    if (pathname === '/' && url.searchParams.has('pathname')) {
      pathname = decodeURIComponent(url.searchParams.get('pathname')!);
      // Ensure pathname starts with "/"
      if (!pathname.startsWith('/')) {
        pathname = '/' + pathname;
      }
    }

    // Ensure we have a valid pathname (not just "/")
    if (pathname === '/') {
      return new Response('Invalid pathname: pathname cannot be empty or just "/"', { status: 400 });
    }

    const data = {
      url: new URL(pathname, url.origin),
      downloadUrl: new URL(pathname + '?download=1', url.origin).toString(),
      pathname: pathname,
      size: blob.size,
      contentType,
      cacheControl,
      uploadedAt: new Date(),
      contentDisposition,
    };

    await Bun.write(path.join(storePath, pathname), blob, { createPath: true });
    await Bun.write(path.join(storePath, pathname + '._vercel_mock_meta_'), JSON.stringify(data, undefined, 2), { createPath: true });

    return Response.json({
      url: new URL(pathname, url.origin),
      downloadUrl: new URL(pathname, url.origin),
      pathname: pathname,
      contentType,
      contentDisposition,
    });
  },
});