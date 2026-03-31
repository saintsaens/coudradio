import { Router } from 'express';
import { updateUserActivity, updateSessionStartTime, getUserRank, getListeners, getListeningTimes } from "../controllers/usersController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

export const usersRouter = Router();

usersRouter.get('/listeners', getListeners);
usersRouter.get('/listening-times', isAuthenticated, getListeningTimes);
usersRouter.get('/:id/rank', getUserRank);
usersRouter.patch('/activity', isAuthenticated, updateUserActivity);
usersRouter.patch('/open', isAuthenticated, updateSessionStartTime);
