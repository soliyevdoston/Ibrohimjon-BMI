# Admin Console

Standalone Next.js 15 app. No backend required — runs on mock data.

## Local

```bash
cd apps/admin
npm install
npm run dev
```

Open http://localhost:3100

## Deploy to Vercel

1. Push the repo to GitHub.
2. In Vercel → New Project → Import the repo.
3. **Root Directory** → set to `apps/admin`.
4. Framework preset: **Next.js** (auto-detected).
5. Deploy.

No environment variables required. The app ships with realistic mock data
for orders, couriers, sellers, and customers so every page renders without
any backend running.

## Routes

- `/` — Dashboard
- `/live` — Live deliveries map + in-flight orders
- `/analytics` — Revenue and status analytics
- `/orders` — Orders table + filters
- `/couriers` — Courier roster
- `/sellers` — Seller directory
- `/users` — Customer directory
- `/settings` — Pricing, security, feature flags
