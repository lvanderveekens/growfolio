BEGIN;

CREATE TABLE IF NOT EXISTS settings(
    user_id TEXT NOT NULL PRIMARY KEY REFERENCES "user" (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    currency TEXT NOT NULL
);

CREATE TRIGGER set_updated_at
    BEFORE UPDATE
    ON settings
    FOR EACH ROW
EXECUTE PROCEDURE trigger_set_updated_at();

COMMIT;