# Frontend VPS Deployment

## 1. DNS and TLS

Point `frontend.social.example.com` to the VPS. Serve the browser app and API over HTTPS. A recommended topology is:

```text
frontend.social.example.com → reverse proxy → 127.0.0.1:3000
api.social.example.com      → reverse proxy → 127.0.0.1:3001
```

The API must allow `https://frontend.social.example.com` as an exact credentialed CORS origin.

## 2. Build

`NEXT_PUBLIC_API_URL` is compiled into the JavaScript bundle, so pass the production URL while building:

```bash
git clone <frontend-repository> social-publisher-frontend
cd social-publisher-frontend
cp .env.example .env
sed -i 's|http://localhost:3001|https://api.social.example.com|' .env
docker compose build --build-arg NEXT_PUBLIC_API_URL=https://api.social.example.com
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health
```

Rebuild the image when the public API URL changes; changing a container environment variable alone cannot rewrite an existing browser bundle.

## 3. NGINX

```nginx
server {
    listen 443 ssl http2;
    server_name frontend.social.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Use Certbot or the VPS provider's managed certificate. Redirect port 80 to HTTPS.

## 4. Upgrade and rollback

Build an immutable version tag before replacing the running container:

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.social.example.com -t social-publisher-frontend:2026-10-08 .
FRONTEND_IMAGE=social-publisher-frontend:2026-10-08 docker compose up -d --no-build --force-recreate
```

Keep the previous image tag for rollback, then rerun the same command with that old `FRONTEND_IMAGE` value. Persist `FRONTEND_IMAGE=<immutable-tag>` in the deployment `.env` so a later plain `docker compose up` does not fall back to `:local`. Verify `/api/health`, login, `/auth/me`, OAuth callback redirects, and the publishing polling table after each release.

## Security checklist

- No secret or credential uses a `NEXT_PUBLIC_*` variable.
- API CORS allows only expected HTTPS frontend origins and allows credentials.
- Refresh cookie is HttpOnly, Secure in production, scoped to `/api/v1/auth`.
- Reverse proxy forwards the original protocol so callback URLs remain HTTPS.
- The frontend port binds to localhost or is firewall-restricted behind the proxy.
- The application sends CSP, `nosniff`, deny-framing, referrer and permissions headers. Its build-time `NEXT_PUBLIC_API_URL` origin is included in CSP `connect-src`.
- Keep complementary WAF and rate limits at the reverse proxy/API boundary.
