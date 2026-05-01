import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./data/beers.db');

const schema = fs.readFileSync('./db/schema.sql', 'utf8');
const seed = fs.readFileSync('./db/seed.sql', 'utf8');

db.exec(schema);
db.exec(seed);

console.log('Database setup complete');
db.close();