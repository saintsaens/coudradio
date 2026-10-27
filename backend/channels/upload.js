import fs from "fs";
import path from "path";
import { minioClient } from "../db-media/index.js";

const [, , sourceDir, bucket] = process.argv;

if (!sourceDir || !bucket) {
    console.error("Usage: node upload.js <sourceDir> <bucket>");
    process.exit(1);
}

const absSourceDir = path.resolve(sourceDir);

if (!fs.existsSync(absSourceDir)) {
    console.error(`Source directory does not exist: ${absSourceDir}`);
    process.exit(1);
}

const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(fullPath) : fullPath;
    });

const uploadFile = async (filePath) => {
    const objectName = path
        .relative(absSourceDir, filePath)
        .replace(/\\/g, "/");

    console.log(`Uploading ${objectName}`);

    await minioClient.fPutObject(
        bucket,
        objectName,
        filePath
    );
};

const files = walk(absSourceDir);

for (const file of files) {
    try {
        await uploadFile(file);
    } catch (err) {
        console.error(`Failed to upload ${file}: ${err.message}`);
        process.exit(1);
    }
}

console.log("Upload complete");
