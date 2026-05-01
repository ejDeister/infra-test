CREATE TABLE IF NOT EXISTS beers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brewery TEXT,
    type TEXT,
    subType TEXT,
    description TEXT,
    rating REAL CHECK(rating >= 0 AND rating <= 5),
    date TEXT CHECK(date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    updatedDate TEXT CHECK(updatedDate GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    image TEXT,
    location TEXT,
    deleted INTEGER NOT NULL DEFAULT 0
);