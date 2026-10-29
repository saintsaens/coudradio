import zlib from "zlib";
import * as mpdService from "../services/mpdService.js"

export const getStream = async (req, res, next) => {
    try {
        const { channel } = req.params;

        if (!channel) {
            return res.status(400).json({ error: 'Invalid channel' });
        }

        const channelStream = await mpdService.getMpdStream(channel);

        res.setHeader('Content-Type', 'application/dash+xml');
        res.setHeader('Vary', 'Accept-Encoding');
        channelStream.on('error', (err) => {
            next(err);
        });

        // MPDs are large, highly repetitive XML: gzip shrinks them by ~95%
        if (req.acceptsEncodings('gzip') === 'gzip') {
            res.setHeader('Content-Encoding', 'gzip');
            channelStream.pipe(zlib.createGzip()).pipe(res);
        } else {
            channelStream.pipe(res);
        }
    } catch (err) {
        next(err);
    }
};
