import { describe, it, vi, expect, beforeEach } from "vitest";
import * as trackRepository from "../../repositories/trackRepository.js";
import { getTracklist } from "../../services/tracklistService.js";

vi.mock("../../repositories/trackRepository.js");

describe("getTracklist", () => {
    const mockChannel = "lofi";
    const mockTracks = ["track1", "track2", "track3"];
    const mockTrackUrls = [
        "https://cdn.example.com/lofi/track1",
        "https://cdn.example.com/lofi/track2",
        "https://cdn.example.com/lofi/track3",
    ];

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should return a list of track URLs for the given channel", async () => {
        trackRepository.getTracks.mockResolvedValue(mockTracks);
        trackRepository.getTrackUrl.mockImplementation((channel, track) =>
            Promise.resolve(`https://cdn.example.com/${channel}/${track}`)
        );

        const result = await getTracklist(mockChannel);

        expect(trackRepository.getTracks).toHaveBeenCalledWith(mockChannel);
        expect(trackRepository.getTrackUrl).toHaveBeenCalledTimes(mockTracks.length);
        mockTracks.forEach((track, _index) => {
            expect(trackRepository.getTrackUrl).toHaveBeenCalledWith(
                mockChannel,
                track
            );
        });
        expect(result).toEqual(mockTrackUrls);
    });

    it("should throw if there are no tracks for the channel", async () => {
        trackRepository.getTracks.mockResolvedValue([]);

        await expect(getTracklist(mockChannel)).rejects.toThrow(
            `No tracks found for channel: ${mockChannel}`
        );

        expect(trackRepository.getTracks).toHaveBeenCalledWith(mockChannel);
        expect(trackRepository.getTrackUrl).not.toHaveBeenCalled();
    });

    it("should propagate errors from getTracks", async () => {
        const mockError = new Error("Error fetching tracks");
        trackRepository.getTracks.mockRejectedValue(mockError);

        await expect(getTracklist(mockChannel)).rejects.toThrow(mockError);

        expect(trackRepository.getTracks).toHaveBeenCalledWith(mockChannel);
        expect(trackRepository.getTrackUrl).not.toHaveBeenCalled();
    });

    it("should propagate errors from getTrackUrl", async () => {
        trackRepository.getTracks.mockResolvedValue(mockTracks);
        const mockError = new Error("Error fetching track URL");
        trackRepository.getTrackUrl.mockImplementation((channel, track) =>
            track === "track2" ? Promise.reject(mockError) : Promise.resolve(`https://cdn.example.com/${channel}/${track}`)
        );

        await expect(getTracklist(mockChannel)).rejects.toThrow(mockError);

        expect(trackRepository.getTracks).toHaveBeenCalledWith(mockChannel);
        expect(trackRepository.getTrackUrl).toHaveBeenCalledTimes(mockTracks.length);
    });
});
