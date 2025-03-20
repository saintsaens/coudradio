import { Router } from "express";
import { getUserProfile, login, logout, redirectBack } from "../controllers/authController.js";

export const authRouter = Router();

authRouter.get("/login", login);
authRouter.get('/oauth2/redirect/google', redirectBack);
authRouter.post("/logout", logout);
authRouter.get("/user/profile", getUserProfile);
