import {
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

/**
 * The architecture implemented below is a set of operations
 * for lambda to perform, most of which are acting on a .db
 * file located in S3. In the case of read/write, lamda must
 * process the whole base64 string representation of the .db
 * binary in memory.
 *
 * For modest use cases of ~100 requests per month and a .db
 * size of ~1MB, the costs are negligible. However, should
 * a newer architecture that supports N users be required,
 * the lambda could simply use signed S3 PUT URLs for DB
 * commits in addition to images to avoid unnecessary games of
 * monkey-in-the-middle.
 */

export async function initDb(s3) {
    try {
        const res = await s3.send(
            new GetObjectCommand({
                Bucket: process.env.DB_BUCKET,
                Key: "beers.db",
            }),
        );
        const bytes = await res.Body.transformToByteArray();
        const b64Buffer = Buffer.from(bytes).toString("base64");

        return { db: b64Buffer };
    } catch (e) {
        if (e.name === "NoSuchKey") return { db: null };
        throw e;
    }
}

export async function commitDb(s3, event) {
    const { db } = JSON.parse(event.body ?? "{}");
    if (!db) throw new Error("Missing db payload");

    const dbBuffer = Buffer.from(db, "base64");
    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.DB_BUCKET,
            Key: "beers.db",
            Body: dbBuffer,
            ContentType: "application/octet-stream",
        }),
    );
    return { ok: true };
}

export async function nukeDb(s3) {
    try {
        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.DB_BUCKET,
                Key: "beers.db",
            }),
        );
    } catch (e) {
        if (e.name === "NoSuchKey") console.warn("DB does not yet exist");
        else throw e;
    }
    return { ok: true };
}

const commands = {
    put: PutObjectCommand,
    get: GetObjectCommand,
    delete: DeleteObjectCommand,
};

export async function makeS3CmdUrl(s3, event) {
    const { cmd: cmdName, key: qKey, ext = "jpg" } = event.queryStringParameters ?? {};
    const Cmd = commands[cmdName];
    if (!Cmd) throw new Error(`Invalid S3 command: ${cmdName}`);

    const key = cmdName === "put" ? `${crypto.randomUUID()}.${ext}` : qKey;
    if (!key) throw new Error("Missing key for non-put command");

    const url = await getSignedUrl(
        s3,
        new Cmd({
            Bucket: process.env.IMAGES_BUCKET,
            Key: key,
        }),
        { expiresIn: 300 },
    );
    return { url, key };
}
