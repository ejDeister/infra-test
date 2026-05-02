# AWS Migration Plan

Port Beer Me from local Express/SQLite to AWS: Lambda (serverless-http) + CloudFront + S3.

---

## Architecture

```
Browser
  └── CloudFront
        ├── /* → S3 (static frontend)
        ├── /img/* → S3 (images bucket)
        └── /api/* → API Gateway → Lambda (Express via serverless-http)
                                        └── S3 (beers.db)
```

- **Frontend**: static files served from S3 via CloudFront — no changes to HTML/CSS
- **Backend**: Express app wrapped in `serverless-http`, deployed as a Lambda function
- **Database**: SQLite file stored in S3, fetched to Lambda `/tmp` on cold start, written back on commits
- **Images**: uploaded direct from browser to S3 via pre-signed PUT URLs; served via CloudFront `/img/*`

---

## Phase 1 — sql.js migration (`Models/datalayer.js`)

Replace `better-sqlite3` (native C++ bindings, incompatible with Lambda) with `sql.js` (pure WASM).

### 1.1 — Add helper functions (mimic better-sqlite3 API)

Add these three helpers to avoid rewriting every query call site:

```js
function sqlAll(query, params = []) {
  const stmt = db.prepare(query);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function sqlGet(query, params = []) {
  const stmt = db.prepare(query);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : undefined;
  stmt.free();
  return row;
}

function sqlRun(query, params = []) {
  db.run(query, params);
  return {
    changes: db.getRowsModified(),
    lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0].values[0][0]
  };
}
```

### 1.2 — Replace module-level db init

```js
// Remove:
import Database from 'better-sqlite3';
const db = new Database('./data/beers.db');

// Add:
import initSqlJs from 'sql.js';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION });
let db;

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
    if (e.name === 'NoSuchKey') db = new SQL.Database(); // first run
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
```

### 1.3 — Swap query call sites

| Function | Old | New |
|---|---|---|
| `getAllBeers` | `db.prepare(q).all()` | `sqlAll(q)` |
| `getTopBeers` | `db.prepare(q).all()` | `sqlAll(q)` |
| `addBeer` | `db.prepare(q).run(name, type, ...)` | `sqlRun(q, [beer.name, beer.type, ...])` |
| `getBeerById` | `db.prepare(q).get(id)` | `sqlGet(q, [id])` |
| `getImageById` | `db.prepare(q).get(id)` | `sqlGet(q, [id])` |
| `editBeer` | `db.prepare(q).run(name, ..., id)` | `sqlRun(q, [beer.name, ..., beer.id])` |
| `deleteBeer` | `db.prepare(q).run(id)` | `sqlRun(q, [id])` |

All functions must be `async` and start with `await initDb()` (currently `getBeerById` and `getImageById` are sync — make them async).

### 1.4 — Add commitDb() after writes

Call `await commitDb()` at the end of `addBeer`, `editBeer`, and `deleteBeer`. This is the S3 write-back on user "commit".

### 1.5 — Swap fs.unlink → S3 delete

Two spots: `editBeer` (old image replaced) and `deleteBeer` (beer removed).

```js
// Remove:
await fs.promises.unlink(`./public/img/${image}`);

// Add:
await s3.send(new DeleteObjectCommand({
  Bucket: process.env.IMAGES_BUCKET,
  Key: image
}));
```

### 1.6 — Update dependencies

```bash
npm uninstall better-sqlite3
npm install sql.js @aws-sdk/client-s3
```

---

## Phase 2 — Image upload/fetch

**Strategy**: pre-signed S3 PUT URLs. The image never passes through Lambda, avoiding API Gateway's 6MB payload limit (a real concern for HEIC phone photos).

Flow:
1. Frontend requests a pre-signed URL: `GET /upload-url?ext=jpg`
2. Lambda returns `{ url, key }` — signs an S3 PutObject, no file involved
3. Frontend PUTs image file directly to S3
4. Frontend submits the rest of the form as JSON with `key` as the `image` field

### 2.1 — Backend: remove Multer, add upload-url endpoint

`Routers/beerRouter.js`:
```js
// Remove:
import multer from 'multer';
const upload = multer({ dest: 'public/img/' });
router.post('/addBeer', upload.single('image'), controller.addBeer);
router.post('/editBeer', upload.single('image'), controller.editBeer);

// Add:
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

router.post('/addBeer', controller.addBeer);
router.post('/editBeer', controller.editBeer);

router.get('/upload-url', async (req, res) => {
  const key = `${crypto.randomUUID()}.${req.query.ext || 'jpg'}`;
  const url = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: process.env.IMAGES_BUCKET,
    Key: key
  }), { expiresIn: 300 });
  res.json({ url, key });
});
```

`Controllers/beerController.js` — `addBeer` and `editBeer`:
```js
// Remove:
beer.image = req.file ? req.file.filename : 'placeholder.png';

// Add:
beer.image = req.body.image || 'placeholder.png';
```

```bash
npm uninstall multer
npm install @aws-sdk/s3-request-presigner
```

### 2.2 — Frontend: pre-upload before form submit

Replace the `addBeer()` function body in `public/scripts/addBeer.js`:

```js
async function addBeer(formData) {
  let imageKey = null;
  const imageFile = formData.get('image');

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop();
    const { url, key } = await fetch(`/upload-url?ext=${ext}`).then(r => r.json());
    await fetch(url, { method: 'PUT', body: imageFile });
    imageKey = key;
  }

  const beer = Object.fromEntries(formData);
  beer.image = imageKey;

  const response = await fetch('/addBeer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(beer)
  });

  if (response.ok) {
    alert('Beer added successfully');
    window.location.href = 'index.html';
  } else {
    alert('Failed to add beer. Please try again.');
  }
}
```

Apply the same pattern to `editBeer()` in `public/scripts/editBeer.js`.

### 2.3 — Image display: no changes needed

CloudFront routes `/img/*` to the images S3 bucket, so `/img/abc123.jpg` continues to work as-is. `setBeerImage`, all display logic, and the placeholder fallback are untouched.

---

## Phase 3 — Lambda entry point

Add a new `lambda.js` at the project root (keep `server.js` for local dev):

```js
import serverlessHttp from 'serverless-http';
import app from './server.js'; // export `app` from server.js without the listen() call

export const handler = serverlessHttp(app);
```

`server.js` — split app creation from `listen()`:
```js
// Add at bottom (replacing app.listen):
export default app;

// In a separate local-dev guard, or keep server.js as-is for local and use lambda.js for Lambda
```

```bash
npm install serverless-http
```

---

## Phase 4 — Terraform

Fill in the stub modules in `terraform/`:

### `modules/sqlite-store/main.tf`
- S3 bucket for `beers.db` with versioning enabled (free safety net against accidental overwrites)
- Bucket policy: private, accessible only by Lambda execution role

### `modules/lambda-crud/main.tf`
- Lambda function (Node.js 20, arm64 recommended for cost)
- IAM role with S3 GetObject/PutObject/DeleteObject on both buckets
- API Gateway HTTP API with `$default` route → Lambda
- Environment variables: `DB_BUCKET`, `IMAGES_BUCKET`, `AWS_REGION`
- Ephemeral storage: 512MB `/tmp` (default is fine; db is small)

### `modules/cloudfront/main.tf`
- Distribution with two S3 origins:
  - Default (`/*`): static frontend bucket
  - `/img/*`: images bucket
  - `/api/*`: API Gateway URL (Lambda)
- OAC (Origin Access Control) on both S3 origins — no public bucket ACLs needed

### `modules/domain-mapping/main.tf`
- ACM certificate (us-east-1, required for CloudFront)
- Route53 A/AAAA alias records pointing to the CloudFront distribution

### `variables.tf`
```hcl
variable "aws_region"    {}
variable "domain_name"   {}  # e.g. "beerme.example.com"
variable "hosted_zone_id" {}
```

### `locals.tf`
```hcl
locals {
  app_name = "beer-me"
  tags = {
    Project = "beer-me"
  }
}
```

---

## Environment variables (Lambda)

| Variable | Value |
|---|---|
| `DB_BUCKET` | name of the SQLite S3 bucket |
| `IMAGES_BUCKET` | name of the images S3 bucket |
| `AWS_REGION` | e.g. `us-east-1` |

---

## Effort estimate

| Phase | Files touched | Estimate |
|---|---|---|
| 1 — sql.js migration | `Models/datalayer.js` only | ~2h |
| 2 — Image upload | `beerRouter.js`, `beerController.js`, `addBeer.js`, `editBeer.js` | ~1h |
| 3 — Lambda entry point | `server.js`, new `lambda.js` | ~30 min |
| 4 — Terraform | 4 module files + root `.tf` files | ~3h |

**Total: ~1 day of focused work.**

---

## Notes

- **Concurrency**: multiple warm Lambda instances can race on `beers.db`. Acceptable for a personal app; mitigate with Lambda reserved concurrency = 1 if it ever matters.
- **Cold start**: sql.js WASM init + S3 fetch adds ~500–800ms to cold starts. Warm invocations are fast.
- **Local dev**: `server.js` continues to work unchanged with the local SQLite file; `lambda.js` is Lambda-only.
- **DB init on first deploy**: `NoSuchKey` catch in `initDb()` creates a fresh database automatically. Run the existing seed/schema logic there if needed.
