import { Router } from "express";
import { authControllers } from "./auth.controller";

const route = Router();

route.post("/login", authControllers.credentialLogin);
route.post("/refresh-token", authControllers.generateAuthTokens);

export const authRoutes = route;
