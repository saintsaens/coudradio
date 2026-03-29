import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as metadataService from '../../services/metadataService.js';
import { getCurrentTrack } from '../../controllers/metadataController.js';

vi.mock('../../services/metadataService.js', () => ({
    getCurrentTrack: vi.fn(),
}));

describe('getCurrentTrack', () => {
    let req, res, next;

    beforeEach(() => {
        req = { params: { channel: 'lofi' } };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        next = vi.fn();
    });

    it('returns the current track as JSON', async () => {
        const mockTrack = 'Chill Beats';
        vi.mocked(metadataService.getCurrentTrack).mockResolvedValue(mockTrack);

        await getCurrentTrack(req, res, next);

        expect(res.json).toHaveBeenCalledWith('Chill Beats');
    });

    it('calls next with an error if the service throws', async () => {
        vi.mocked(metadataService.getCurrentTrack).mockRejectedValue(new Error('metadata unavailable'));

        await getCurrentTrack(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
