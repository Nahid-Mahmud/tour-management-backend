import crypto from "crypto";
import { redisClient } from "../../config/redis.config";
import { sendEmail } from "../../utils/sendEmail";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";
import User from "../user/user.model";

const OTP_EXPIRATION_TIME = 2 * 60; // 2 minutes in seconds

const generateOtp = (length = 6): string => {
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
  return otp;
};

const sendOtp = async (email: string, name: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  if (user.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is already verified");
  }

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

const verifyOtp = async (email: string, otp: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  if (user.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is already verified");
  }

  const redisKey = `otp:${email}`;
  const savedOtp = await redisClient.get(redisKey);
  if (!savedOtp) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "OTP has expired or does not exist");
  }
  if (savedOtp !== otp) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid OTP");
  }

  await Promise.all([User.updateOne({ email }, { isVerified: true }), redisClient.del(redisKey)]);
};

export const otpServices = {
  sendOtp,
  verifyOtp,
};
