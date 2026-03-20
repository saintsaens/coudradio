import { Router } from 'express';
import { createUser, deleteUser, getUserById, updateUser, updateUserActivity, updateSessionStartTime, getUserRank, getListeners } from "../controllers/usersController.js";

export const usersRouter = Router();

usersRouter.post('/signup', createUser);
usersRouter.get('/listeners', getListeners);
usersRouter.get('/:id', getUserById);
usersRouter.get('/:id/rank', getUserRank);
usersRouter.put('/:id', updateUser);
usersRouter.patch('/activity', updateUserActivity);
usersRouter.patch('/open', updateSessionStartTime);
usersRouter.delete('/delete/:id', deleteUser);
