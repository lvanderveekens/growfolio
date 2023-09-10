BEGIN;

ALTER TABLE investment
ADD COLUMN user_id TEXT; 

ALTER TABLE investment
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id) REFERENCES "user"(id);

COMMIT;