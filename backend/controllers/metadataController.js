import * as metadataService from '../services/metadataService.js';

export const getCurrentTrack = async (req, res, next) => {
    try {
        const track = await metadataService.getCurrentTrack(req.params.channel);
        res.json(track);
    } catch (err) {
        next(err);
    }
};
