import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import { authControllers } from "./auth.controller";
import envVariables from "../../config/env";

const route = Router();

route.post("/login", authControllers.credentialLogin);
route.post("/refresh-token", authControllers.generateAccessTokensUsingRefreshToken);
route.post("/logout", authControllers.logout);
route.patch("/reset-password", checkAuth(...Object.values(UserRole)), authControllers.resetPassword);
route.patch("/change-password", checkAuth(...Object.values(UserRole)), authControllers.changePassword);
route.post("/set-password", checkAuth(...Object.values(UserRole)), authControllers.setPassword);
// route.post("/forgot-password", authControllers.forgotPassword);

route.get("/google", async (req: Request, res: Response, next: NextFunction) => {
  const redirect = (req.query.redirect as string) || "/";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    // Pass the redirect URL as state to the Google authentication
    state: redirect,
  })(req, res, next);
});

route.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${envVariables.FRONTEND_URL}/login?error=There is some issue with your account. Please contact support.`,
  }),
  authControllers.googleCallback
);

export const authRoutes = route;
