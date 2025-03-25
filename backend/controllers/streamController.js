import * as mpdService from "../services/mpdService.js"

export const getStream = async (req, res) => {
    try {
        const { channel } = req.params;
        const channelName = channel;

        if (!channelName) {
            return res.status(400).send('Invalid channel');
        }

        const channelStream = await mpdService.getMpdStream(channelName);

        res.setHeader('Content-Type', 'application/dash+xml');

        channelStream.pipe(res);
        channelStream.on('error', (err) => {
            console.error(`Error streaming ${channel} file:`, err.message);
            res.status(500).send('Error streaming mpd file');
        });
    } catch (error) {
        console.error(`Error retrieving ${req.params.channel} stream:`, error.message);
        res.status(500).send(`${req.params.channel} stream not available`);
    }
};
