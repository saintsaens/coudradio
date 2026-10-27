// Imported first by CLI scripts so the backend .env is loaded whatever the working directory
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
process.env.MINIO_QUIET = 'true';
