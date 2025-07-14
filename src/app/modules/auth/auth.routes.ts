import { Router } from "express";
import { authControllers } from "./auth.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";

const route = Router();

route.post("/login", authControllers.credentialLogin);
route.post("/refresh-token", authControllers.generateAuthTokens);
route.post("/logout", authControllers.logout);
route.patch("/reset-password", checkAuth(...Object.values(UserRole)), authControllers.resetPassword);

export const authRoutes = route;
