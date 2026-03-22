import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as metadataService from '../../services/metadataService.js';
import { getMetadata, updateMetadata } from '../../controllers/metadataController.js';

// metadataService imports a non-existent metadataRepository, so a factory is required
// to prevent Vitest from loading the real module and crashing on the missing dependency.
vi.mock('../../services/metadataService.js', () => ({
    getTrackMetadata: vi.fn(),
    updateTrackMetadata: vi.fn(),
}));

describe('getMetadata', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        next = vi.fn();
    });

    it('returns the track metadata as JSON', async () => {
        const mockMetadata = { name: 'Chill Beats', artist: 'Lo-Fi DJ' };
        vi.mocked(metadataService.getTrackMetadata).mockReturnValue(mockMetadata);

        await getMetadata(req, res, next);

        expect(res.json).toHaveBeenCalledWith(mockMetadata);
    });

    it('calls next with an error if the service throws', async () => {
        vi.mocked(metadataService.getTrackMetadata).mockImplementation(() => {
            throw new Error('metadata unavailable');
        });

        await getMetadata(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});

describe('updateMetadata', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        next = vi.fn();
    });

    it('returns the updated metadata as JSON', async () => {
        const mockMetadata = { name: 'Jazz Vibes', artist: 'Smooth Cat' };
        vi.mocked(metadataService.updateTrackMetadata).mockReturnValue(mockMetadata);

        await updateMetadata(req, res, next);

        expect(res.json).toHaveBeenCalledWith(mockMetadata);
    });

    it('calls next with an error if the service throws', async () => {
        vi.mocked(metadataService.updateTrackMetadata).mockImplementation(() => {
            throw new Error('update failed');
        });

        await updateMetadata(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
