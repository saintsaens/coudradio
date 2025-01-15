import { describe, it, vi, expect, beforeEach } from "vitest";
import * as mpdService from "../../services/mpdService.js";
import * as tracklistService from "../../services/tracklistService.js";
import { createRadio, createChannel, getChannel } from "../../services/radioService.js";

vi.mock("../../services/mpdService.js");
vi.mock("../../services/tracklistService.js");

describe("radioService", () => {
    const mockChannelName = "lofi";
    const mockTracklist = [
        "track1",
        "track2",
        "track3",
    ];
    const mockUnifiedMPDPath = "/public/lofi/unified.mpd";
    const mockRadio = { lofi: mockUnifiedMPDPath };

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("createChannel", () => {
        it("should create a channel", async () => {
            tracklistService.getTracklist.mockResolvedValue(mockTracklist);
            mpdService.createUnifiedMPD.mockResolvedValue(mockUnifiedMPDPath);

            const result = await createChannel(mockChannelName);

            expect(result).toBe(mockUnifiedMPDPath);
        });

        it("should propagate errors from getTracklist", async () => {
            const mockError = new Error("Failed to fetch tracklist");
            tracklistService.getTracklist.mockRejectedValue(mockError);

            await expect(createChannel(mockChannelName)).rejects.toThrow(mockError);

            expect(tracklistService.getTracklist).toHaveBeenCalledWith(mockChannelName);
            expect(mpdService.createUnifiedMPD).not.toHaveBeenCalled();
        });

        it("should propagate errors from createUnifiedMPD", async () => {
            tracklistService.getTracklist.mockResolvedValue(mockTracklist);
            const mockError = new Error("Failed to create MPD");
            mpdService.createUnifiedMPD.mockRejectedValue(mockError);

            await expect(createChannel(mockChannelName)).rejects.toThrow(mockError);

            expect(tracklistService.getTracklist).toHaveBeenCalledWith(mockChannelName);
            expect(mpdService.createUnifiedMPD).toHaveBeenCalledWith(
                mockTracklist.slice(0, 5),
                mockChannelName
            );
        });
    });

    describe("getChannel", () => {
        it("should return the channel if it exists in the radio object", () => {
            const result = getChannel(mockRadio, "lofi");
            expect(result).toBe(mockUnifiedMPDPath);
        });

        it("should throw an error if the channel does not exist", () => {
            expect(() => getChannel(mockRadio, "nonexistent")).toThrow(
                "Channel not found"
            );
        });
    });
});
