BEGIN;

ALTER TABLE investment_update ADD COLUMN deposit BIGINT;  
ALTER TABLE investment_update ADD COLUMN withdrawal BIGINT;  

COMMIT;