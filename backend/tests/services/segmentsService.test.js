import { describe, it, vi, expect } from "vitest";
import * as segmentsRepository from "../../repositories/segmentsRepository.js";
import { getSegmentStream } from "../../services/segmentsService.js";

vi.mock("../../repositories/segmentsRepository.js");

describe("getSegmentStream", () => {
    it("delegates to segmentsRepository.getSegment and returns the stream", async () => {
        const mockStream = { pipe: vi.fn() };
        segmentsRepository.getSegment.mockResolvedValueOnce(mockStream);

        const result = await getSegmentStream("lofi", "track0_1.m4s");

        expect(segmentsRepository.getSegment).toHaveBeenCalledWith("lofi", "track0_1.m4s");
        expect(result).toBe(mockStream);
    });
});
