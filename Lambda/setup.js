import initSqlJs from 'sql.js';
import { s3client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const s3 = new s3client({ region: process.env.aws_region });
export let db;

export async function initDb() {
  if (db) return;
  const SQL = await initSqlJs();
  try {
    const res = await s3.send(new GetObjectCommand({
      Bucket: process.env.DB_BUCKET,
      Key: 'beers.db'
    }));
    const buffer = await res.Body.transformToByteArray();
    db = new SQL.Database(buffer);
  } catch (e) {
    if (e.name === 'NoSuchKey') db = new SQL.Database();
    else throw e;
  }
}

export async function commitDb() {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.DB_BUCKET,
    Key: 'beers.db',
    Body: Buffer.from(db.export())
  }));
}

export async function nukeDb() {
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.DB_BUCKET,
      Key: 'beers.db',
    }));
  } catch (e) {
    if (e.name === 'NoSuchKey') console.warn('DB does not yet exist');
  }
}
