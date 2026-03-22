import * as segmentsService from "../services/segmentsService.js";

export const getSegment = async (req, res) => {
    try {
        const { channelName, segmentName } = req.params;
        if (!channelName) {
            return res.status(400).send('Channel name is required');
        }
        if (!segmentName) {
            return res.status(400).send('Segment name is required');
        }

        const segmentStream = await segmentsService.getSegmentStream(channelName, segmentName)

        res.setHeader('Content-Type', 'audio/mp4');  // For .m4s and .mp4 segments

        segmentStream.pipe(res);
        segmentStream.on('error', (err) => {
            console.error('Error streaming file:', err.message);
            res.status(500).send('Error streaming segment file');
        });

    } catch (error) {
        console.error('Error retrieving segment:', error.message);
        res.status(500).send('Error retrieving segment');
    }
};