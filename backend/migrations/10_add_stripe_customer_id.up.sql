BEGIN;

ALTER TABLE "user" ADD COLUMN stripe_customer_id TEXT;  

COMMIT;