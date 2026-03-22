import { putSegmentObject } from "../../repositories/segmentsRepository.js";

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;
const TIMEOUT_MS = 15_000;

const delay = (ms) => new Promise(r => setTimeout(r, ms));

const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        delay(ms).then(() => {
            throw new Error("Upload timed out");
        })
    ]);

export const uploadSegment = async (segmentPath, segmentName, channel) => {
  const objectName = `${process.env.MINIO_SEGMENTS_PATH}/${channel}/${segmentName}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await withTimeout(
        putSegmentObject(objectName, segmentPath),
        TIMEOUT_MS
      );

      return objectName;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.error(
          `Upload failed for ${segmentName} after ${MAX_RETRIES} attempts`,
          err
        );
        return null; // explicit decision, service-level
      }

      console.warn(
        `Upload attempt ${attempt} failed for ${segmentName}, retrying in ${BASE_DELAY * attempt}ms`
      );
      await delay(BASE_DELAY * attempt);
    }
  }
};
