# Deployment Guide (single server: Nginx + Next.js + Express + PostgreSQL)

Target layout:

```
Internet -> Nginx :80/:443 --/api/--> Express 127.0.0.1:5000 --> PostgreSQL 127.0.0.1:5432
                          \--/-----> Next.js 127.0.0.1:3000
```

Only ports 22, 80 and 443 are open. 3000, 5000 and 5432 are never public.
Replace `example.com` and every `CHANGE_ME` below. Commands marked **[Ubuntu]** / **[RHEL]** differ by distro.

## 1. Packages

**[Ubuntu]**
```bash
sudo apt update && sudo apt install -y nginx postgresql postgresql-contrib git curl ca-certificates
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential
```

**[RHEL 9]**
```bash
sudo dnf install -y nginx postgresql-server postgresql-contrib git curl gcc-c++ make
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql
sudo dnf module enable -y nodejs:22 && sudo dnf install -y nodejs
```

Check: `node -v` (20+), `nginx -v`, `psql --version`.

## 2. PostgreSQL (local only)

```bash
sudo systemctl enable --now postgresql
sudo -u postgres psql <<'SQL'
CREATE USER hostapp_user WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE hostapp_dev OWNER hostapp_user;
SQL
```

Use a **new** database. Do not point this app at an existing production DB.

Keep it private: confirm `listen_addresses = 'localhost'` (default) in `postgresql.conf`.
- Ubuntu: `/etc/postgresql/<ver>/main/postgresql.conf`
- RHEL: `/var/lib/pgsql/data/postgresql.conf`

**[RHEL only]** password login over localhost needs `scram-sha-256` (or `md5`) instead of `ident` in `/var/lib/pgsql/data/pg_hba.conf`:
```
host    all    all    127.0.0.1/32    scram-sha-256
host    all    all    ::1/128         scram-sha-256
```
Then `sudo systemctl restart postgresql`. Test: `psql "postgresql://hostapp_user:CHANGE_ME@localhost:5432/hostapp_dev" -c "select 1"`.
Verify it is not public: `ss -tlnp | grep 5432` must show `127.0.0.1:5432` (not `0.0.0.0`).

## 3. Application user and code

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin hostlab   # Ubuntu: /usr/sbin/nologin, RHEL: same
sudo mkdir -p /opt/hostlab && sudo chown hostlab:hostlab /opt/hostlab
sudo -u hostlab git clone <your-repo-url> /opt/hostlab/src   # or copy the project here
```
This guide assumes the `backend/` and `frontend/` folders live at `/opt/hostlab/backend` and `/opt/hostlab/frontend`:
```bash
sudo -u hostlab bash -c 'cp -r /opt/hostlab/src/backend /opt/hostlab/src/frontend /opt/hostlab/'
```

## 4. Environment files

```bash
sudo -u hostlab cp /opt/hostlab/backend/.env.example /opt/hostlab/backend/.env
sudo -u hostlab nano /opt/hostlab/backend/.env
```
Set: `NODE_ENV=production`, `DATABASE_URL`, `FRONTEND_URL=https://example.com`, and two secrets from `openssl rand -base64 48` (`JWT_SECRET`, `COOKIE_SECRET`).
```bash
sudo chmod 600 /opt/hostlab/backend/.env
```
Frontend (value is baked in at build time):
```bash
echo 'NEXT_PUBLIC_API_URL=https://example.com/api' | sudo -u hostlab tee /opt/hostlab/frontend/.env.production
```
Before you have SSL, use `http://example.com/api`, `FRONTEND_URL=http://example.com` and `COOKIE_SECURE=false` in the backend `.env`, then switch back after step 8.

## 5. Build and migrate

```bash
cd /opt/hostlab/backend
sudo -u hostlab npm ci
sudo -u hostlab npx prisma migrate deploy
sudo -u hostlab npm run seed        # optional: demo@example.com / Demo@12345
sudo -u hostlab npm run build

cd /opt/hostlab/frontend
sudo -u hostlab npm ci
sudo -u hostlab npm run build
```
If `npm ci` complains about a missing lockfile, run `npm install` once locally, commit the generated `package-lock.json`, and use `npm ci` on the server.

## 6. systemd services

```bash
sudo cp /opt/hostlab/src/deployment/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now backend frontend
systemctl status backend frontend
journalctl -u backend -f
```
Local checks (on the server):
```bash
curl -s http://127.0.0.1:5000/api/health
curl -s http://127.0.0.1:5000/api/health/database
curl -sI http://127.0.0.1:3000
```
PM2 alternative: `sudo npm i -g pm2 && pm2 start dist/server.js --name backend` (in backend) and `pm2 start npm --name frontend -- run start` (in frontend), then `pm2 save && pm2 startup`.

## 7. Nginx + domain

DNS: create `A` (and `AAAA`) records for `example.com` and `www` pointing to the server's public IP. Check with `dig +short example.com`.

**[Ubuntu]**
```bash
sudo cp /opt/hostlab/src/deployment/nginx/website.conf /etc/nginx/sites-available/website
sudo ln -s /etc/nginx/sites-available/website /etc/nginx/sites-enabled/website
sudo rm -f /etc/nginx/sites-enabled/default
```
**[RHEL]**
```bash
sudo cp /opt/hostlab/src/deployment/nginx/website.conf /etc/nginx/conf.d/website.conf
```
Edit `server_name`, then:
```bash
sudo nginx -t && sudo systemctl enable --now nginx && sudo systemctl reload nginx
```

## 8. SSL (Let's Encrypt)

**[Ubuntu]**
```bash
sudo apt install -y certbot python3-certbot-nginx
```
**[RHEL 9]**
```bash
sudo dnf install -y epel-release || true
sudo dnf install -y certbot python3-certbot-nginx
```
Then:
```bash
sudo certbot --nginx -d example.com -d www.example.com
sudo certbot renew --dry-run
```
Switch `.env` files to `https://`, remove `COOKIE_SECURE=false`, rebuild the frontend, and restart: `sudo systemctl restart backend frontend`.

## 9. Firewall

**[Ubuntu - ufw]**
```bash
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable && sudo ufw status
```
**[RHEL - firewalld]**
```bash
sudo firewall-cmd --permanent --add-service=ssh --add-service=http --add-service=https
sudo firewall-cmd --reload && sudo firewall-cmd --list-all
```
Do NOT open 3000, 5000 or 5432. From another machine, `nc -vz <server-ip> 5000` should fail.

## 10. SELinux (RHEL)

Keep SELinux **enforcing** (`getenforce`). Nginx must be allowed to connect to the local upstreams:
```bash
sudo setsebool -P httpd_can_network_connect 1
```
If services fail to start from `/opt`, check labels and denials:
```bash
sudo ausearch -m avc -ts recent
sudo dnf install -y policycoreutils-python-utils setroubleshoot-server   # optional helpers
ls -Z /opt/hostlab
```
Node binaries under `/usr/bin` run fine under systemd. Do not `setenforce 0` as a fix; read the denial and apply the specific boolean or `restorecon -Rv /opt/hostlab`.

## 11. Updating

```bash
cd /opt/hostlab/src && sudo -u hostlab git pull
# re-copy folders (or deploy directly from one checkout), then:
cd /opt/hostlab/backend && sudo -u hostlab npm ci && sudo -u hostlab npx prisma migrate deploy && sudo -u hostlab npm run build
cd /opt/hostlab/frontend && sudo -u hostlab npm ci && sudo -u hostlab npm run build
sudo systemctl restart backend frontend
```

## 12. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| 502 Bad Gateway | Service not running (`systemctl status backend frontend`); on RHEL missing `httpd_can_network_connect`; wrong port |
| Login seems to work but you are logged out on refresh | `Secure` cookie over plain HTTP: use HTTPS, or `COOKIE_SECURE=false` temporarily. Also check `FRONTEND_URL` matches the browser origin exactly |
| CORS error in browser console | `FRONTEND_URL` differs from the site origin (scheme, host, port) |
| Frontend calls `localhost:5000` in production | `NEXT_PUBLIC_API_URL` was wrong at build time; fix `.env.production` and rebuild |
| `Invalid environment configuration` at start | A required variable is missing or secrets shorter than 32 chars |
| `P1001 Can't reach database` | PostgreSQL stopped, wrong `DATABASE_URL`, or RHEL `pg_hba.conf` still uses `ident` |
| `P1000 Authentication failed` | Wrong DB password; reset: `ALTER USER hostapp_user PASSWORD '...'` |
| `EADDRINUSE` | Port already used: `sudo ss -tlnp | grep ':5000'` |
| 429 Too Many Requests | Rate limiter; wait, or all users share one IP because `trust proxy`/`X-Forwarded-For` is missing |
| `nginx -t` fails | Syntax error or duplicate `server_name`/default site still enabled |
| Certbot challenge fails | DNS not pointing here yet, or port 80 blocked by firewall/cloud security group |
| Permission denied in `/opt/hostlab` | Files not owned by `hostlab`: `sudo chown -R hostlab:hostlab /opt/hostlab` |
| `bcrypt` build/load errors | Missing build tools (`build-essential` / `gcc-c++ make`), or `node_modules` copied from another OS: reinstall on the server |
