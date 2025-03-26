import { Router } from 'express';
import { getStream } from '../controllers/streamController.js';

export const streamRouter = Router();

streamRouter.get('/:channel', getStream);
