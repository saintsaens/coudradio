import { Router } from 'express';
import { updateUserActivity, updateSessionStartTime, getUserRank, getListeners, getChannelListeningTime } from "../controllers/usersController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

export const usersRouter = Router();

usersRouter.get('/listeners', getListeners);
usersRouter.get('/channel-time/:channel', isAuthenticated, getChannelListeningTime);
usersRouter.get('/:id/rank', getUserRank);
usersRouter.patch('/activity', isAuthenticated, updateUserActivity);
usersRouter.patch('/open', isAuthenticated, updateSessionStartTime);
