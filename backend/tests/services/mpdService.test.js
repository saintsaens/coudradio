import { describe, expect, it } from "vitest";
import { iso8601DurationToSeconds, secondsToIso8601Duration } from "../../services/mpdService.js";

describe("iso8601DurationToSeconds", () => {
    it("converts hours, minutes and fractional seconds", () => {
        expect(iso8601DurationToSeconds("PT1H2M3.5S")).toBe(3723.5);
        expect(iso8601DurationToSeconds("PT2M12.0S")).toBe(132);
        expect(iso8601DurationToSeconds("PT0.0S")).toBe(0);
    });

    it("returns 0 for an unparseable duration", () => {
        expect(iso8601DurationToSeconds("P1D")).toBe(0);
    });
});

describe("secondsToIso8601Duration", () => {
    it("round-trips through iso8601DurationToSeconds to the millisecond", () => {
        expect(secondsToIso8601Duration(3723.5)).toBe("PT1H2M3.5S");
        expect(iso8601DurationToSeconds(secondsToIso8601Duration(12345.6789))).toBe(12345.679);
    });
});
