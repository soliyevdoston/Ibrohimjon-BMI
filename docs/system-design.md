# Delivery Platform System Design

## 1) Architecture explanation

### Modular monolith boundaries

- `AuthModule`: OTP, token issuance, refresh token rotation, brute-force protection.
- `UsersModule`: profile retrieval.
- `ProductsModule`: catalog search, filters, product CRUD for sellers.
- `OrdersModule`: checkout orchestration, inventory reservation, order status lifecycle, call courier.
- `DeliveriesModule`: courier matching, accept/reject flow, delivery status progression, live GPS ingestion.
- `PaymentsModule`: create payment session, callback idempotency, timeout handling.
- `RealtimeModule`: WebSocket gateway, room-based status/location updates.
- `AdminModule`: users/sellers/couriers/orders control and manual assignment.
- `HealthModule`: health checks and system heartbeat endpoint.

### Request lifecycle (checkout example)

1. Customer calls `POST /orders` with cart + delivery location + idempotency key.
2. Controller validates DTO using global `ValidationPipe`.
3. Service checks seller/products and performs stock decrement atomically in transaction.
4. Service computes delivery fee using Haversine distance.
5. Order + order_items + initial status history are persisted.
6. Realtime event publishes `order:status` update.
7. Seller updates order to `READY_FOR_PICKUP` and triggers `POST /orders/:id/call-courier`.
8. Delivery enters `SEARCHING_COURIER`; available couriers see it.
9. Courier accepts, then status transitions to `PICKED_UP`, `ON_THE_WAY`, `DELIVERED`.
10. GPS updates stream every 3-5 seconds (throttled at backend).

### Scaling strategy

- Horizontal scale app instances behind load balancer.
- Keep API stateless (JWT) and use shared PostgreSQL + optional Redis.
- Use room-based WebSocket events by `order:{id}` and `delivery:{id}` to reduce fanout.
- Offload heavy workflows (notifications, analytics, retries) to background workers.
- Add read replicas for product browsing and admin analytics.

### Caching points

- Categories and active product lists (`GET /products`, `GET /products/categories`) with short TTL.
- Seller dashboard aggregates cached 30-60 seconds.
- Courier available delivery list cached for a few seconds.
- OTP and rate-limit counters can be stored in Redis.

## 2) Database schema

See Prisma schema: `apps/backend/prisma/schema.prisma`

Core tables:
- users
- sellers
- couriers
- categories
- products
- orders
- order_items
- payments
- deliveries
- courier_locations
- order_status_history
- otp_codes
- refresh_tokens

Indexes and constraints:
- Unique constraints on `users.phone`, `orders.idempotencyKey`, `payments.orderId`, `courier.userId`, `seller.userId`.
- Query indexes for `orders(status, createdAt)`, `deliveries(status, createdAt)`, `courier_locations(deliveryId, capturedAt)`.
- Idempotency on payment callback via `payments.callbackIdempotency`.

## 3) API design

Base prefix: `/api/v1`

### Auth
- `POST /auth/otp/request`
- `POST /auth/otp/verify`
- `POST /auth/refresh`

### Customer
- `GET /products`
- `GET /products/categories`
- `POST /orders`
- `GET /orders/my`
- `GET /orders/:id`
- `POST /payments/create`

### Seller
- `POST /products`
- `PATCH /products/:id`
- `DELETE /products/:id`
- `GET /orders/seller`
- `GET /orders/seller/dashboard`
- `PATCH /orders/:id/seller-status`
- `POST /orders/:id/call-courier`
- `GET /seller/profile`
- `POST /seller/profile`

### Courier
- `GET /deliveries/available`
- `POST /deliveries/:id/accept`
- `POST /deliveries/:id/reject`
- `GET /deliveries/active`
- `PATCH /deliveries/:id/status`
- `POST /deliveries/:id/location`
- `GET /courier/profile`
- `POST /courier/profile`
- `PATCH /courier/presence`

### Admin
- `GET /admin/dashboard`
- `GET /admin/users`
- `GET /admin/sellers`
- `GET /admin/couriers`
- `GET /admin/orders`
- `POST /admin/orders/manual-assign`

### Health
- `GET /health`

## 4) Backend code

Backend root: `apps/backend`

Key files:
- `src/main.ts` bootstrap, security middleware, validation, swagger
- `src/app.module.ts` modular monolith wiring
- `src/modules/orders/orders.service.ts` checkout, idempotency, status transitions
- `src/modules/deliveries/deliveries.service.ts` courier assignment and live GPS
- `src/modules/payments/payments.service.ts` payment creation, callback idempotency, expiry
- `src/modules/realtime/realtime.gateway.ts` room-based websocket updates
- `src/modules/auth/auth.service.ts` OTP and JWT refresh token rotation

## 5) Frontend code

Frontend root: `apps/frontend`

Key files:
- `app/(customer)/customer/*` browsing, checkout, tracking UX
- `app/(seller)/seller/*` seller dashboard, products, orders workflow
- `app/(courier)/courier/*` courier acceptance and in-trip actions
- `app/(admin)/admin/*` operations control view
- `components/*` panel nav, skeleton loader, empty state, timeline, map preview
- `stores/*` Zustand auth/cart/tracking
- `middleware.ts` route-level panel protection by role cookie

## 6) UX explanation

- 8px rhythm and soft card-based visual hierarchy.
- Rounded corners (`lg/2xl`) and neutral palette with one primary color.
- Skeleton loaders for initial fetch states.
- Empty and error states with friendly copy.
- Micro-interactions: hover scale, press feedback, smooth marker transitions.
- Customer flow optimized for <= 3 clicks to core actions.
- Mobile-first adaptive nav for customer and courier contexts.
