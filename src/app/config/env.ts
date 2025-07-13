import dotenv from "dotenv";

dotenv.config();

interface EnvVariables {
  PORT: string;
  MONGO_URI: string;
  NODE_ENV: "development" | "production";
  BCRYPT_SALT_ROUNDS: string;
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
  ACCESS_TOKEN_JWT_SECRET: string;
  ACCESS_TOKEN_JWT_EXPIRATION: string;
  REFRESH_TOKEN_JWT_SECRET: string;
  REFRESH_TOKEN_JWT_EXPIRATION: string;
}

const loadEnvVariable = (): EnvVariables => {
  const requiredEnvVariables = ["PORT", "MONGO_URI", "NODE_ENV"];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });

  return {
    PORT: process.env.PORT as string,
    MONGO_URI: process.env.MONGO_URI as string,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS as string,
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
    ACCESS_TOKEN_JWT_SECRET: process.env.ACCESS_TOKEN_JWT_SECRET as string,
    ACCESS_TOKEN_JWT_EXPIRATION: process.env.ACCESS_TOKEN_JWT_EXPIRATION as string,
    REFRESH_TOKEN_JWT_SECRET: process.env.REFRESH_TOKEN_JWT_SECRET as string,
    REFRESH_TOKEN_JWT_EXPIRATION: process.env.REFRESH_TOKEN_JWT_EXPIRATION as string,
  };
};

const envVariables = loadEnvVariable();
export default envVariables;
