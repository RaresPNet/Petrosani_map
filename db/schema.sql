DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS pins;

CREATE TABLE IF NOT EXISTS pins (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name        TEXT NOT NULL,
    description TEXT,
    type        TEXT NOT NULL,
    x           REAL NOT NULL,
    y           REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS images (
    id      TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    pin_id  TEXT NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
    mime    TEXT NOT NULL,
    data    BLOB NOT NULL
);