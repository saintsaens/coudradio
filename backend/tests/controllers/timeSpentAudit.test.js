// Regression tests for the time-spent tracking fixes.
// See https://github.com/saintsaens/coudradio/issues/97
//
// These assert the CORRECTED behaviour of updateUserActivity: per-ping deltas are
// clamped so sleep / throttled-tab / inter-session gaps can't be booked as
// continuous listening, and users.time_spent is no longer touched by activity.
import { vi, test, expect, describe, beforeEach } from 'vitest';
import * as usersService from "../../services/usersService.js";
import * as usersRepository from "../../repositories/usersRepository.js";
import { updateUserActivity } from "../../controllers/usersController.js";
import { clampActivityDelta, MAX_ACTIVITY_DELTA_SECONDS } from "../../utils/durations.js";

vi.mock('../../services/usersService.js');
vi.mock('../../repositories/usersRepository.js');

describe('Time-spent fixes — updateUserActivity', () => {
    let req, res, next;

    beforeEach(() => {
        vi.clearAllMocks();
        res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
        next = vi.fn();
        usersService.updateUser.mockResolvedValue({ id: 1, username: 'alice' });
        usersRepository.upsertListeningTime.mockResolvedValue();
    });

    test('a long sleep/throttle gap is clamped, not booked whole', async () => {
        // Was: 8h gap booked entirely. Now: clamped to MAX_ACTIVITY_DELTA_SECONDS.
        const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
        req = { body: { channel: 'jazz' }, user: { id: 1, lastActivity: eightHoursAgo } };

        await updateUserActivity(req, res, next);

        const [, , delta] = usersRepository.upsertListeningTime.mock.calls[0];
        expect(delta).toBe(MAX_ACTIVITY_DELTA_SECONDS);
    });

    test('the first ping after login no longer books the offline gap', async () => {
        // Was: days of offline time booked at once. Now: clamped.
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        req = { body: { channel: 'jazz' }, user: { id: 1, lastActivity: threeDaysAgo } };

        await updateUserActivity(req, res, next);

        const [, , delta] = usersRepository.upsertListeningTime.mock.calls[0];
        expect(delta).toBe(MAX_ACTIVITY_DELTA_SECONDS);
    });

    test('a normal ~59s ping is recorded verbatim to the current channel', async () => {
        const fiftyNineSecondsAgo = new Date(Date.now() - 59 * 1000);
        req = { body: { channel: 'techno' }, user: { id: 1, lastActivity: fiftyNineSecondsAgo } };

        await updateUserActivity(req, res, next);

        const [userId, channel, delta] = usersRepository.upsertListeningTime.mock.calls[0];
        expect(userId).toBe(1);
        expect(channel).toBe('techno');
        expect(delta).toBeGreaterThanOrEqual(58);
        expect(delta).toBeLessThanOrEqual(MAX_ACTIVITY_DELTA_SECONDS);
    });

    test('worst-case channel misattribution is bounded by the clamp', async () => {
        // The delta is still attributed to the channel in the request body, but it
        // can never exceed MAX_ACTIVITY_DELTA_SECONDS, so a stray gap can't dump
        // hours onto the wrong channel.
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        req = { body: { channel: 'techno' }, user: { id: 1, lastActivity: oneHourAgo } };

        await updateUserActivity(req, res, next);

        const [, , delta] = usersRepository.upsertListeningTime.mock.calls[0];
        expect(delta).toBe(MAX_ACTIVITY_DELTA_SECONDS);
    });

    test('activity never writes users.time_spent (listening_time is the source of truth)', async () => {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        req = { body: { channel: 'jazz' }, user: { id: 1, lastActivity: oneMinuteAgo } };

        await updateUserActivity(req, res, next);

        const [, payload] = usersService.updateUser.mock.calls[0];
        expect(payload).not.toHaveProperty('timeSpent');
    });
});

describe('clampActivityDelta', () => {
    test('passes through small deltas unchanged', () => {
        expect(clampActivityDelta(0)).toBe(0);
        expect(clampActivityDelta(59)).toBe(59);
        expect(clampActivityDelta(MAX_ACTIVITY_DELTA_SECONDS)).toBe(MAX_ACTIVITY_DELTA_SECONDS);
    });

    test('clamps anything above the max', () => {
        expect(clampActivityDelta(MAX_ACTIVITY_DELTA_SECONDS + 1)).toBe(MAX_ACTIVITY_DELTA_SECONDS);
        expect(clampActivityDelta(8 * 60 * 60)).toBe(MAX_ACTIVITY_DELTA_SECONDS);
    });
});
