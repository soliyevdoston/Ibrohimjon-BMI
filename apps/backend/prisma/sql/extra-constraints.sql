-- Optional hard constraints to apply after initial Prisma migration.

ALTER TABLE "Order"
  ADD CONSTRAINT order_amounts_non_negative
  CHECK ("subtotalAmount" >= 0 AND "deliveryFeeAmount" >= 0 AND "totalAmount" >= 0);

ALTER TABLE "OrderItem"
  ADD CONSTRAINT order_item_qty_positive
  CHECK ("quantity" > 0);

ALTER TABLE "CourierLocation"
  ADD CONSTRAINT courier_location_lat_range
  CHECK ("lat" >= -90 AND "lat" <= 90),
  ADD CONSTRAINT courier_location_lng_range
  CHECK ("lng" >= -180 AND "lng" <= 180);

CREATE INDEX IF NOT EXISTS idx_order_customer_recent
  ON "Order" ("customerId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_payment_status_created
  ON "Payment" ("status", "createdAt");
