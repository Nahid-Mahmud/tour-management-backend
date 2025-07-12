import { Router } from "express";
import { authControllers } from "./auth.controller";

const route = Router();

route.post("/login", authControllers.credentialLogin);

export const authRoutes = route;
