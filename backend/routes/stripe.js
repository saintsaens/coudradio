import express from "express";
import { Router } from 'express';
import { webhook } from "../controllers/stripeController.js";

export const stripeRouter = Router();

stripeRouter.post('/webhook', express.raw({type: 'application/json'}), webhook);
