import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as mpdService from '../../services/mpdService.js';
import { getStream } from '../../controllers/streamController.js';

vi.mock('../../services/mpdService.js');

describe('getStream', () => {
    let req, res, next;

    beforeEach(() => {
        req = { params: {}, acceptsEncodings: vi.fn().mockReturnValue(false) };
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
        expect(res.setHeader).not.toHaveBeenCalledWith('Content-Encoding', 'gzip');
    });

    it('gzips the stream when the client accepts gzip', async () => {
        const gzipStream = { pipe: vi.fn() };
        const mockStream = { pipe: vi.fn().mockReturnValue(gzipStream), on: vi.fn() };
        vi.mocked(mpdService.getMpdStream).mockResolvedValue(mockStream);
        req.params = { channel: 'lofi' };
        req.acceptsEncodings.mockReturnValue('gzip');

        await getStream(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
        expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding');
        expect(mockStream.pipe).not.toHaveBeenCalledWith(res);
        expect(gzipStream.pipe).toHaveBeenCalledWith(res);
    });

    it('calls next with an error when the service throws', async () => {
        vi.mocked(mpdService.getMpdStream).mockRejectedValue(new Error('stream unavailable'));
        req.params = { channel: 'lofi' };

        await getStream(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
