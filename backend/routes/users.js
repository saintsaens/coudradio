import { Router } from 'express';
import { createUser, deleteUser, getUserById, updateUser, updateUserActivity, updateSessionStartTime } from "../controllers/usersController.js";

export const usersRouter = Router();

usersRouter.post('/signup', createUser);
usersRouter.get('/:id', getUserById);
usersRouter.put('/:id', updateUser);
usersRouter.patch('/activity', updateUserActivity);
usersRouter.patch('/close', updateSessionStartTime);
usersRouter.delete('/delete/:id', deleteUser);
