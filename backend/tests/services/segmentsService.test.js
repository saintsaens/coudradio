import { describe, it, vi, expect, beforeEach } from "vitest";
import * as segmentsRepository from "../../repositories/segmentsRepository.js";
import { uploadSegment, getSegmentStream } from "../../services/segmentsService.js";
import fs from "fs";
import path from "path";

vi.mock("../../repositories/segmentsRepository.js");
vi.mock("fs");

describe("uploadSegment", () => {
    const mockSegmentPath = "./public/lofi/track0_1.m4s";
    const mockSegmentName = path.basename(mockSegmentPath);
    const mockObjectName = `segments/lofi/${mockSegmentName}`;

    beforeEach(() => {
        vi.resetAllMocks();
        process.env.MINIO_SEGMENTS_PATH = "segments";
    });

    it("should upload the segment and return the object name", async () => {
        fs.existsSync.mockReturnValue(true);
        segmentsRepository.putSegmentObject.mockResolvedValue(mockObjectName);

        const result = await uploadSegment(mockSegmentPath, "lofi");

        expect(fs.existsSync).toHaveBeenCalledWith(mockSegmentPath);
        expect(segmentsRepository.putSegmentObject).toHaveBeenCalledWith(
            `segments/lofi/${mockSegmentName}`,
            mockSegmentPath
        );
        expect(result).toBe(mockObjectName);
    });

    it("should throw if the file does not exist", async () => {
        fs.existsSync.mockReturnValue(false);

        await expect(uploadSegment(mockSegmentPath, "lofi")).rejects.toThrow(
            `File not found at path: ${mockSegmentPath}`
        );

        expect(fs.existsSync).toHaveBeenCalledWith(mockSegmentPath);
        expect(segmentsRepository.putSegmentObject).not.toHaveBeenCalled();
    });

    it("should propagate errors from the repository", async () => {
        fs.existsSync.mockReturnValue(true);
        const mockError = new Error("Repository error");
        segmentsRepository.putSegmentObject.mockRejectedValue(mockError);

        await expect(uploadSegment(mockSegmentPath, "lofi")).rejects.toThrow(mockError);

        expect(fs.existsSync).toHaveBeenCalledWith(mockSegmentPath);
        expect(segmentsRepository.putSegmentObject).toHaveBeenCalled();
    });
});

describe("getSegmentStream", () => {
    it("delegates to segmentsRepository.getSegment and returns the stream", async () => {
        const mockStream = { pipe: vi.fn() };
        segmentsRepository.getSegment.mockResolvedValueOnce(mockStream);

        const result = await getSegmentStream("lofi", "track0_1.m4s");

        expect(segmentsRepository.getSegment).toHaveBeenCalledWith("lofi", "track0_1.m4s");
        expect(result).toBe(mockStream);
    });
});
