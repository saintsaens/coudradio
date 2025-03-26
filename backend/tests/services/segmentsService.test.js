import { describe, it, vi, expect, beforeEach } from "vitest";
import * as segmentsRepository from "../../repositories/segmentsRepository.js";
import { uploadSegment } from "../../services/segmentsService.js";
import fs from "fs";
import path from "path";

vi.mock("../../repositories/segmentsRepository.js");
vi.mock("fs");

describe("uploadSegment", () => {
    const mockSegmentPath = "./public/lofi/track0_1.m4s";
    const mockSegmentStream = { stream: true }; // Mock object to simulate stream
    const mockSegmentName = path.basename(mockSegmentPath);
    const mockUploadedSegmentName = `uploaded_${mockSegmentName}`;

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should upload the segment and return the uploaded segment name", async () => {
        fs.existsSync.mockReturnValue(true); // Mock the file exists check
        fs.createReadStream.mockReturnValue(mockSegmentStream); // Mock stream creation
        segmentsRepository.uploadSegment.mockResolvedValue(mockUploadedSegmentName); // Mock repository call

        const result = await uploadSegment(mockSegmentPath, "lofi");

        expect(fs.existsSync).toHaveBeenCalledWith(mockSegmentPath);
        expect(fs.createReadStream).toHaveBeenCalledWith(mockSegmentPath);
        expect(segmentsRepository.uploadSegment).toHaveBeenCalledWith(
            mockSegmentStream,
            mockSegmentName,
            "lofi"
        );
        expect(result).toBe(mockUploadedSegmentName);
    });

    it("should throw an error if the file does not exist", async () => {
        fs.existsSync.mockReturnValue(false); // Mock the file does not exist

        await expect(uploadSegment(mockSegmentPath)).rejects.toThrow(
            `File not found at path: ${mockSegmentPath}`
        );

        expect(fs.existsSync).toHaveBeenCalledWith(mockSegmentPath);
        expect(fs.createReadStream).not.toHaveBeenCalled();
        expect(segmentsRepository.uploadSegment).not.toHaveBeenCalled();
    });

    it("should propagate errors from the repository", async () => {
        fs.existsSync.mockReturnValue(true); // Mock the file exists check
        fs.createReadStream.mockReturnValue(mockSegmentStream); // Mock stream creation
        const mockError = new Error("Repository error");
        segmentsRepository.uploadSegment.mockRejectedValue(mockError); // Mock repository error

        await expect(uploadSegment(mockSegmentPath, "lofi")).rejects.toThrow(mockError);

        expect(fs.existsSync).toHaveBeenCalledWith(mockSegmentPath);
        expect(fs.createReadStream).toHaveBeenCalledWith(mockSegmentPath);
        expect(segmentsRepository.uploadSegment).toHaveBeenCalledWith(
            mockSegmentStream,
            mockSegmentName,
            "lofi"
        );
    });
});