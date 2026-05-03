import { S3Client } from "@aws-sdk/client-s3";
import { initDb, commitDb, nukeDb, makeS3CmdUrl } from "./commands.js";

const s3 = new S3Client({ region: process.env.AWS_REGION });

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const ok = (data) => ({
    statusCode: 200,
    headers: { "Content-Type": "application/json", ...CORS },
    body: JSON.stringify(data),
});

const err = (status, message) => ({
    statusCode: status,
    headers: { "Content-Type": "application/json", ...CORS },
    body: JSON.stringify({ message }),
});

export const handler = async (event) => {
    const path = event.requestContext?.http?.path ?? "/";

    if (event.requestContext?.http?.method === "OPTIONS") return ok({});

    try {
        switch (path) {
            case "/": // Fallthrough to /initDb for same functionality
            case "/initDb":
                return ok(await initDb(s3));
            case "/commitDb":
                return ok(await commitDb(s3, event));
            case "/nukeDb":
                return ok(await nukeDb(s3));
            case "/makeS3Url":
                return ok(await makeS3CmdUrl(s3, event));
            default:
                return err(404, "Route not found.");
        }
    } catch (e) {
        console.error(e);
        return err(500, e.message);
    }
};
