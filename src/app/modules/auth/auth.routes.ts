import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import { authControllers } from "./auth.controller";

const route = Router();

route.post("/login", authControllers.credentialLogin);
route.post("/refresh-token", authControllers.generateAccessTokensUsingRefreshToken);
route.post("/logout", authControllers.logout);
route.patch("/reset-password", checkAuth(...Object.values(UserRole)), authControllers.resetPassword);
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
    failureRedirect: "/login",
  }),
  authControllers.googleCallback
);

export const authRoutes = route;
