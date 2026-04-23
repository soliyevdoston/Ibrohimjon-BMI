# Delivery Platform MVP

A production-grade mini marketplace + delivery platform with four separated role panels:

- Customer
- Seller
- Courier
- Admin

## Stack

- Frontend: Next.js App Router + Zustand
- Backend: NestJS modular monolith + Prisma
- Database: PostgreSQL
- Realtime: Socket.IO (WebSocket)

## Monorepo structure

- `apps/backend` NestJS API
- `apps/frontend` Next.js App Router client
- `docs/system-design.md` architecture, schema, APIs, UX notes

## Local run

1. Configure env files from examples.
2. Install deps in workspace.
3. Run backend and frontend.

```bash
npm install
npm run dev
```

## Deployment targets

- Frontend: Vercel
- Backend: Render
- Database: PostgreSQL managed instance

## Security baseline

- JWT access + refresh token rotation
- OTP expiration + retry limits
- Role guards for panel isolation
- Validation pipes + DTO contracts
- Helmet + compression + throttling

## Documentation

See `docs/system-design.md` for full architecture, APIs, scaling, and UX rationale.
