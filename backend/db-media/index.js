import * as Minio from 'minio';
import dotenv from 'dotenv';

dotenv.config();

export const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

export const getBucketByChannel = (channel) => {
    switch (channel) {
        case 'lofi':
            return process.env.MINIO_LOFI_BUCKET;
        case 'coudrier':
            return process.env.MINIO_COUDRIER_BUCKET;
        default:
            throw new Error('Invalid channel');
    }
};

export default minioClient;
