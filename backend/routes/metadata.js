import { Router } from 'express';
import { getCurrentTrack } from '../controllers/metadataController.js';

export const metadataRouter = Router();

metadataRouter.get('/:channel', getCurrentTrack);
