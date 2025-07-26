import crypto from "crypto";
import { redisClient } from "../../config/redis.config";
import { sendEmail } from "../../utils/sendEmail";

const OTP_EXPIRATION_TIME = 2 * 60; // 2 minutes in seconds

const generateOtp = (length = 6): string => {
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
  return otp;
};

const sendOtp = async (email: string, name: string) => {
  const otp = generateOtp();
  // store otp in redis
  const redisKey = `otp:${email}`;
  await redisClient.set(redisKey, otp, {
    expiration: {
      type: "EX",
      value: OTP_EXPIRATION_TIME,
    },
  });

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    templateName: "otp.ejs",
    templateData: {
      name,
      otp,
    },
  });
};

const verifyOtp = async () => {
  //
};

export const otpServices = {
  sendOtp,
  verifyOtp,
};
