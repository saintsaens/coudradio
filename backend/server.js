import express from 'express';
import corsLoader from "./loaders/corsLoader.js";
import morganLoader from "./loaders/morganLoader.js";
import mountRoutes from "./routes/index.js";
import dotenv from 'dotenv';
import { connectionTracker } from "./loaders/connectionTracker.js";
import sessionLoader from "./loaders/sessionLoader.js";
import passportLoader from "./loaders/passportLoader.js";
import jsonParserLoader from "./loaders/jsonParserLoader.js";
import https from 'https';
import fs from 'fs';

dotenv.config();

export const PORT = process.env.PORT;
const app = express();

// Middleware and app configuration
app.set('trust proxy', 1);
jsonParserLoader(app);
morganLoader(app);
corsLoader(app);
connectionTracker(app);
sessionLoader(app);
passportLoader(app);

// Mount routes
mountRoutes(app);

if (process.env.NODE_ENV !== "prod") {
    const key = fs.readFileSync(process.env.SSL_KEY_PATH);
    const cert = fs.readFileSync(process.env.SSL_CERT_PATH);

    https.createServer({ key, cert }, app).listen(PORT, () => {
        console.log("🚀 Backend running on https://localhost:3001");
    });
} else {
    app.listen(PORT, () => {
        console.log("🚀 Backend running on http://localhost:3001");
    });
}
