import initSqlJs from 'sql.js';
import { sqlAll, sqlRun, sqlGet, s3Command, LAMBDA_URL } from './utils.js';

export let db;

export const initDb = async () => {
    const SQL = await initSqlJs();
    const res = await fetch(`${LAMBDA_URL}/initDb`);
    const { db: b64 } = await res.json();

    if (b64) {
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        db = new SQL.Database(bytes);
    } else {
        db = new SQL.Database();
        db.run(`
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
            )
        `);
    }
};

export const commitDb = async () => {
    const data = db.export();
    let binary = '';
    for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);

    const res = await fetch(`${LAMBDA_URL}/commitDb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db: btoa(binary) }),
    });
    if (!res.ok) throw new Error(`commitDb failed: ${res.status}`);
};

export const getAllBeers = () => {
    return sqlAll(db, 'SELECT * FROM beers ORDER BY date DESC');
};

export const getTopBeers = () => {
    return sqlAll(db, 'SELECT * FROM beers ORDER BY rating DESC LIMIT 10');
};

export const getBeerById = (id) => {
    return sqlGet(db, 'SELECT * FROM beers WHERE id = ?', [id]);
};

export const getImageById = (id) => {
    const row = sqlGet(db, 'SELECT image FROM beers WHERE id = ?', [id]);
    return row ? row.image : null;
};

export const addBeer = async (beer) => {
    const query = `
        INSERT INTO beers (name, type, brewery, description, location, rating, image, date)
        VALUES (?,?,?,?,?,?,?,?)
    `;
    return sqlRun(db, query, [
        beer.name, beer.type, beer.brewery, beer.description,
        beer.location, beer.rating, beer.image, beer.date,
    ]);
};

export const editBeer = async (beer) => {
    if (beer.image) {
        const existingImage = getImageById(beer.id);
        const query = `
            UPDATE beers
            SET name = ?, type = ?, brewery = ?, description = ?,
                location = ?, rating = ?, image = ?, updatedDate = ?
            WHERE id = ?
        `;
        const result = sqlRun(db, query, [
            beer.name, beer.type, beer.brewery, beer.description,
            beer.location, beer.rating, beer.image, beer.updatedDate, beer.id,
        ]);

        if (existingImage && existingImage !== 'placeholder.png' && existingImage !== beer.image) {
            await s3Command('delete', existingImage);
        }

        return { ...result, image: beer.image, updatedDate: beer.updatedDate };
    } else {
        const query = `
            UPDATE beers
            SET name = ?, type = ?, brewery = ?, description = ?,
                location = ?, rating = ?, updatedDate = ?
            WHERE id = ?
        `;
        const result = sqlRun(db, query, [
            beer.name, beer.type, beer.brewery, beer.description,
            beer.location, beer.rating, beer.updatedDate, beer.id,
        ]);
        return { ...result, updatedDate: beer.updatedDate };
    }
};

export const deleteBeer = async (id) => {
    const image = getImageById(id);
    const result = sqlRun(db, 'DELETE FROM beers WHERE id = ?', [id]);

    if (image && image !== 'placeholder.png') {
        try {
            await s3Command('delete', image);
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    }

    if (result.changes === 0) return { ok: false, message: 'Beer not found' };
    return { ok: true, message: 'Beer deleted successfully' };
};
