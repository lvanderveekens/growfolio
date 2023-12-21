BEGIN;

CREATE INDEX idx_investment_update_date ON investment_update("date");

COMMIT;