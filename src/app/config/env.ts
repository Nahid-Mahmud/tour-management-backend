import dotenv from "dotenv";

dotenv.config();

interface EnvVariables {
  PORT: string;
  MONGO_URI: string;
  NODE_ENV: "development" | "production";
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  BCRYPT_SALT_ROUNDS: string;
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
    JWT_SECRET: process.env.JWT_SECRET as string,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION as string,
    BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS as string,
  };
};

const envVariables = loadEnvVariable();
export default envVariables;
