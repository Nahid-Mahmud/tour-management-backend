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
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  EXPRESS_SESSION_SECRET: string;
  FRONTEND_URL: string;
  SSL: {
    SSL_STORE_ID: string;
    SSL_STORE_PASSWORD: string;
    SSL_PAYMENT_API: string;
    SSL_VALIDATION_API: string;
    SSL_SUCCESS_BACKEND_URL: string;
    SSL_FAIL_BACKEND_URL: string;
    SSL_CANCEL_BACKEND_URL: string;
    SSL_SUCCESS_FRONTEND_URL: string;
    SSL_FAIL_FRONTEND_URL: string;
    SSL_CANCEL_FRONTEND_URL: string;
  };
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };
  EMAIL_SENDER: {
    SMTP_PASS: string;
    SMTP_USER: string;
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_FROM: string;
  };
}

const loadEnvVariable = (): EnvVariables => {
  const requiredEnvVariables = [
    "PORT",
    "MONGO_URI",
    "NODE_ENV",
    "BCRYPT_SALT_ROUNDS",
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_PASSWORD",
    "ACCESS_TOKEN_JWT_SECRET",
    "ACCESS_TOKEN_JWT_EXPIRATION",
    "REFRESH_TOKEN_JWT_SECRET",
    "REFRESH_TOKEN_JWT_EXPIRATION",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL",
    "EXPRESS_SESSION_SECRET",
    "FRONTEND_URL",
    "SSL_STORE_ID",
    "SSL_STORE_PASSWORD",
    "SSL_PAYMENT_API",
    "SSL_VALIDATION_API",
    "SSL_SUCCESS_BACKEND_URL",
    "SSL_FAIL_BACKEND_URL",
    "SSL_CANCEL_BACKEND_URL",
    "SSL_SUCCESS_FRONTEND_URL",
    "SSL_FAIL_FRONTEND_URL",
    "SSL_CANCEL_FRONTEND_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "SMTP_PASS",
    "SMTP_USER",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_FROM",
  ];

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
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
    EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    SSL: {
      SSL_STORE_ID: process.env.SSL_STORE_ID as string,
      SSL_STORE_PASSWORD: process.env.SSL_STORE_PASSWORD as string,
      SSL_PAYMENT_API: process.env.SSL_PAYMENT_API as string,
      SSL_VALIDATION_API: process.env.SSL_VALIDATION_API as string,
      SSL_SUCCESS_BACKEND_URL: process.env.SSL_SUCCESS_BACKEND_URL as string,
      SSL_FAIL_BACKEND_URL: process.env.SSL_FAIL_BACKEND_URL as string,
      SSL_CANCEL_BACKEND_URL: process.env.SSL_CANCEL_BACKEND_URL as string,
      SSL_SUCCESS_FRONTEND_URL: process.env.SSL_SUCCESS_FRONTEND_URL as string,
      SSL_FAIL_FRONTEND_URL: process.env.SSL_FAIL_FRONTEND_URL as string,
      SSL_CANCEL_FRONTEND_URL: process.env.SSL_CANCEL_FRONTEND_URL as string,
    },
    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    },
    EMAIL_SENDER: {
      SMTP_PASS: process.env.SMTP_PASS as string,
      SMTP_USER: process.env.SMTP_USER as string,
      SMTP_HOST: process.env.SMTP_HOST as string,
      SMTP_PORT: process.env.SMTP_PORT as string,
      SMTP_FROM: process.env.SMTP_FROM as string,
    },
  };
};

const envVariables = loadEnvVariable();
export default envVariables;
