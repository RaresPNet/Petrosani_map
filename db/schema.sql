CREATE TABLE IF NOT EXISTS pins (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name        TEXT NOT NULL,
    description TEXT,
    type        TEXT NOT NULL,
    x           REAL NOT NULL,
    y           REAL NOT NULL
);