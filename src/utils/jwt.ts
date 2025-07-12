import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

export const generateToken = (jwtPayload: JwtPayload, jwtSecret: string, expiresIn: string) => {
  const token = jwt.sign(jwtPayload, jwtSecret, {
    expiresIn,
  } as SignOptions);
  return token;
};

export const verifyToken = (token: string, jwtSecret: string) => {
  const decoded = jwt.verify(token, jwtSecret);
  return decoded as JwtPayload;
};
