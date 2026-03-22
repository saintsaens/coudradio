import * as mpdService from "../services/mpdService.js"

export const getStream = async (req, res, next) => {
    try {
        const { channel } = req.params;

        if (!channel) {
            return res.status(400).json({ error: 'Invalid channel' });
        }

        const channelStream = await mpdService.getMpdStream(channel);

        res.setHeader('Content-Type', 'application/dash+xml');
        channelStream.pipe(res);
        channelStream.on('error', (err) => {
            next(err);
        });
    } catch (err) {
        next(err);
    }
};
