import * as Minio from 'minio';
import dotenv from 'dotenv';

dotenv.config();

export const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : undefined,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

minioClient.listBuckets().then(() => {
    console.log('Connected to MinIO successfully!');
}).catch((err) => {
    console.error('Problem connecting to MinIO. Check endpoint/port/SSL settings and whether a firewall or Cloudflare is blocking this server\'s IP.');
    console.error('  endPoint:', process.env.MINIO_ENDPOINT);
    console.error('  port:', process.env.MINIO_PORT);
    console.error('  useSSL:', process.env.MINIO_USE_SSL);
    console.error('  MPD bucket:', process.env.MINIO_MPD_BUCKET, '| path:', process.env.MINIO_MPD_PATH);
    console.error('  Segments bucket:', process.env.MINIO_SEGMENTS_BUCKET, '| path:', process.env.MINIO_SEGMENTS_PATH);
    console.error('  Error:', err);
});

export default minioClient;
