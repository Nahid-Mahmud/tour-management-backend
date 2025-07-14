/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response, Router } from "express";
import { authControllers } from "./auth.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import passport from "passport";

const route = Router();

route.post("/login", authControllers.credentialLogin);
route.post("/refresh-token", authControllers.generateAccessTokensUsingRefreshToken);
route.post("/logout", authControllers.logout);
route.patch("/reset-password", checkAuth(...Object.values(UserRole)), authControllers.resetPassword);
route.get("/google", async (req: Request, res: Response, _next: NextFunction) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res);
});

route.get("google/callback", authControllers.googleCallback);

export const authRoutes = route;
