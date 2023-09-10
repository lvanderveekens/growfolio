BEGIN;

CREATE OR REPLACE FUNCTION trigger_set_updated_at() RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS investment(
    id UUID NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

CREATE TRIGGER set_updated_at
    BEFORE UPDATE
    ON investment
    FOR EACH ROW
EXECUTE PROCEDURE trigger_set_updated_at();

COMMIT;