import * as metadataService from '../services/metadataService.js';

export const getMetadata = async (req, res, next) => {
    try {
        const metadata = metadataService.getTrackMetadata();
        res.json(metadata);
    } catch (err) {
        next(err);
    }
};

export const updateMetadata = async (req, res, next) => {
    try {
        const metadata = metadataService.updateTrackMetadata();
        res.json(metadata);
    } catch (err) {
        next(err);
    }
};
