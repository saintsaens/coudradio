import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as mpdService from '../../services/mpdService.js';
import { getStream } from '../../controllers/streamController.js';

vi.mock('../../services/mpdService.js');

describe('getStream', () => {
    let req, res, next;

    beforeEach(() => {
        req = { params: {} };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            setHeader: vi.fn(),
        };
        next = vi.fn();
    });

    it('returns 400 if channel param is missing', async () => {
        req.params = {};

        await getStream(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid channel' });
    });

    it('sets Content-Type to application/dash+xml and pipes the stream on success', async () => {
        const mockStream = { pipe: vi.fn(), on: vi.fn() };
        vi.mocked(mpdService.getMpdStream).mockResolvedValue(mockStream);
        req.params = { channel: 'lofi' };

        await getStream(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/dash+xml');
        expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });

    it('calls next with an error when the service throws', async () => {
        vi.mocked(mpdService.getMpdStream).mockRejectedValue(new Error('stream unavailable'));
        req.params = { channel: 'lofi' };

        await getStream(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
