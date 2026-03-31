import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as segmentsService from '../../services/segmentsService.js';
import { getSegment } from '../../controllers/segmentController.js';

vi.mock('../../services/segmentsService.js');

describe('getSegment', () => {
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

    it('returns 400 if channelName is missing', async () => {
        req.params = { segmentName: 'track0_1.m4s' };

        await getSegment(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Channel name is required' });
    });

    it('returns 400 if segmentName is missing', async () => {
        req.params = { channelName: 'lofi' };

        await getSegment(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Segment name is required' });
    });

    it('sets Content-Type to audio/mp4 and pipes the stream on success', async () => {
        const mockStream = { pipe: vi.fn(), on: vi.fn() };
        vi.mocked(segmentsService.getSegmentStream).mockResolvedValue(mockStream);
        req.params = { channelName: 'lofi', segmentName: 'track0_1.m4s' };

        await getSegment(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'audio/mp4');
        expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });

    it('calls next with an error if the service throws', async () => {
        vi.mocked(segmentsService.getSegmentStream).mockRejectedValue(new Error('minio down'));
        req.params = { channelName: 'lofi', segmentName: 'track0_1.m4s' };

        await getSegment(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
