import { Router } from "express";
import { authControllers } from "./auth.controller";

const route = Router();

route.post("/login", authControllers.credentialLogin);
route.post("/refresh-token", authControllers.generateAuthTokens);
route.post("/logout", authControllers.logout);

export const authRoutes = route;
