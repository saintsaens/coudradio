import { Router } from 'express';
import { getUserById, updateUserActivity, updateSessionStartTime, getUserRank, getListeners } from "../controllers/usersController.js";

export const usersRouter = Router();

usersRouter.get('/listeners', getListeners);
usersRouter.get('/:id', getUserById);
usersRouter.get('/:id/rank', getUserRank);
usersRouter.patch('/activity', updateUserActivity);
usersRouter.patch('/open', updateSessionStartTime);
