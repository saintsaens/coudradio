import * as segmentsService from "../services/segmentsService.js";

export const getSegment = async (req, res, next) => {
    try {
        const { channelName, segmentName } = req.params;

        if (!channelName) {
            return res.status(400).json({ error: 'Channel name is required' });
        }
        if (!segmentName) {
            return res.status(400).json({ error: 'Segment name is required' });
        }

        const segmentStream = await segmentsService.getSegmentStream(channelName, segmentName);

        res.setHeader('Content-Type', 'audio/mp4');
        segmentStream.pipe(res);
        segmentStream.on('error', (err) => {
            next(err);
        });
    } catch (err) {
        next(err);
    }
};
