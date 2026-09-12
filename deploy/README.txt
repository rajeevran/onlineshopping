NOADUA production image/API deployment

1. npm install
2. npm run build
3. Restart the PM2/Node process.
4. Merge deploy/nginx-noadua.conf into the existing HTTPS Nginx server block.
5. Run: nginx -t && systemctl reload nginx

The application now uploads each image separately and optimizes oversized browser images to about 850 KB. Nginx should still be configured with client_max_body_size 10M so requests are not rejected by the reverse proxy.

Images are served through /api/uploads/... so they do not depend on Nginx exposing the Next.js public directory directly. Existing /uploads/... URLs are rewritten when the request reaches Next.js.
