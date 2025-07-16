import { Response } from "express";

interface TokenInfo {
  accessToken?: string;
  refreshToken?: string;
}

export const setAuthCookie = (res: Response, tokenInfo: TokenInfo) => {

  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000 * 24, // 1 day
    });
  }

  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000 * 24 * 30, // 30 days
    });
  }
};
