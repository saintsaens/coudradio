import * as Minio from 'minio';
import dotenv from 'dotenv';

dotenv.config();

const minioConfig = {
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : undefined,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY ? '***' : undefined,
};
console.log('[MinIO] Client config:', minioConfig);
console.log('[MinIO] Buckets — MPD:', process.env.MINIO_MPD_BUCKET, '| MPD path:', process.env.MINIO_MPD_PATH);
console.log('[MinIO] Buckets — Segments:', process.env.MINIO_SEGMENTS_BUCKET, '| Segments path:', process.env.MINIO_SEGMENTS_PATH);

export const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : undefined,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

export default minioClient;
