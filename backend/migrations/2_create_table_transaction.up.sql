BEGIN;

CREATE TABLE IF NOT EXISTS transaction(
    id UUID NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    investment_id UUID NOT NULL REFERENCES investment (id),
    amount BIGINT NOT NULL
);

CREATE TRIGGER set_updated_at
    BEFORE UPDATE
    ON transaction
    FOR EACH ROW
EXECUTE PROCEDURE trigger_set_updated_at();

COMMIT;