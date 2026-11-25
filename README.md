# HostLab - Full-Stack Hosting Practice App

A Server Management Dashboard built to practice **real Linux hosting**: Nginx reverse proxy, systemd, PostgreSQL, SSL, firewall and SELinux on Ubuntu and RHEL.

## 1. Overview
Users register, log in, manage tasks and notes, see dashboard stats, edit their profile, and use a **System Status** page that tests frontend→backend and backend→database connectivity live.

## 2. Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Lucide, React Hook Form, Zod |
| Backend | Node.js, Express, TypeScript, Zod, JWT, bcrypt, helmet, pino |
| Database | PostgreSQL + Prisma ORM |
| Ports | Next.js 3000, Express 5000, PostgreSQL 5432 |

## 3. Requirements
Node.js 20+ (22 recommended), npm, PostgreSQL 14+, Git. For production: Nginx, a domain, a Linux server (Ubuntu or RHEL).

## 4. Local development
```bash
git clone <repo> hostlab && cd hostlab
npm run install:all        # installs backend + frontend dependencies
```

## 5. PostgreSQL (new development database)
```bash
# Ubuntu: sudo apt install postgresql        RHEL: sudo dnf install postgresql-server && sudo postgresql-setup --initdb && sudo systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE USER hostapp_user WITH PASSWORD 'CHANGE_ME';"
sudo -u postgres psql -c "CREATE DATABASE hostapp_dev OWNER hostapp_user;"
```
Prisma migrate dev also needs to create a shadow database; if it complains, run `ALTER USER hostapp_user CREATEDB;`.

## 6. Environment
```bash
cp backend/.env.example backend/.env      # fill DATABASE_URL, JWT_SECRET, COOKIE_SECRET (openssl rand -base64 48)
cp frontend/.env.example frontend/.env.local
```
| Backend var | Meaning |
|---|---|
| PORT / HOST | Listen port (5000) and bind address (127.0.0.1) |
| NODE_ENV | development or production |
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET, COOKIE_SECRET | 32+ char random secrets |
| FRONTEND_URL | Exact browser origin allowed by CORS |
| COOKIE_SECURE | Optional; `false` only for pre-SSL testing |

Frontend: `NEXT_PUBLIC_API_URL` (build-time). Real `.env` files are git-ignored. Never commit them.

## 7. Migrations and seed
```bash
cd backend
npx prisma migrate deploy      # applies prisma/migrations (use `npm run prisma:migrate` while editing the schema)
npm run seed                   # demo@example.com / Demo@12345
```

## 8-9. Run locally
```bash
npm run dev:backend     # http://localhost:5000/api/health
npm run dev:frontend    # http://localhost:3000
```

## 10. Production build
```bash
npm run build           # backend: prisma generate + tsc ; frontend: next build
npm run typecheck
```
Backend start: `cd backend && npm start`. Frontend start: `cd frontend && npm start` (binds 127.0.0.1:3000).

## 11-16. Linux deployment
Complete step-by-step commands for **Ubuntu and RHEL** (packages, PostgreSQL, systemd, Nginx, domain/DNS, Let's Encrypt, ufw/firewalld, SELinux) are in [`deployment/deployment-guide.md`](deployment/deployment-guide.md). Config files: [`deployment/nginx/website.conf`](deployment/nginx/website.conf), [`deployment/systemd/`](deployment/systemd/).

Quick summary of the production shape:
- Nginx listens on 80/443; `/api/` → `127.0.0.1:5000`, everything else → `127.0.0.1:3000`.
- Frontend and API share one domain, so `NEXT_PUBLIC_API_URL=https://example.com/api` and the session cookie is first-party.
- PostgreSQL listens on localhost only; firewall opens only SSH, HTTP, HTTPS.
- RHEL: keep SELinux enforcing and run `setsebool -P httpd_can_network_connect 1`.

## 17. Troubleshooting
See the table at the end of the deployment guide (502s, cookie/HTTPS issues, CORS, Prisma P1000/P1001, EADDRINUSE, certbot, SELinux).

## API
| Method | Path | Auth |
|---|---|---|
| POST | /api/auth/register, /api/auth/login, /api/auth/logout | no |
| GET | /api/auth/me | yes |
| GET, PUT | /api/users/profile | yes |
| GET | /api/users/stats | yes |
| GET, POST | /api/tasks | yes |
| GET, PUT, DELETE | /api/tasks/:id | yes |
| GET, POST | /api/notes | yes |
| PUT, DELETE | /api/notes/:id | yes |
| GET | /api/health, /api/health/database | no |
| GET | /api/system/info | yes |

Quick curl test:
```bash
curl -c jar -H 'Content-Type: application/json' -d '{"email":"demo@example.com","password":"Demo@12345"}' http://localhost:5000/api/auth/login
curl -b jar http://localhost:5000/api/tasks
```

## Security notes
bcrypt (cost 12) password hashing; JWT in a signed **HttpOnly, SameSite=Lax, Secure (production)** cookie, never localStorage; Zod validation on every body; Prisma parameterized queries; every task/note query filters by the owner's id (other users' ids return 404); helmet headers; CORS locked to `FRONTEND_URL`; global and login rate limits; React auto-escapes all user content.
