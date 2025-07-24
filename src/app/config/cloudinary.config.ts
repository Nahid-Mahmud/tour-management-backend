import { v2 as cloudinary } from "cloudinary";
import { StatusCodes } from "http-status-codes";
import AppError from "../errorHelpers/AppError";
import envVariables from "./env";

cloudinary.config({
  cloud_name: envVariables.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVariables.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVariables.CLOUDINARY.CLOUDINARY_API_SECRET,
});

export const deleteImageFormCloudinary = async (url: string) => {
  // https://res.cloudinary.com/dyzuwklhu/image/upload/v1753369119/1dutg8xx9xv-1753369116632-martin-baron-p3qjjsimxo4-unsplash-jpg.jpg.jpg

  if (!url || typeof url !== "string") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Image URL is required and must be a string");
  }

  // regex to extract public ID from the URL
  const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp)$/i;

  const match = url.match(regex);

  // check if match is not found

  if (!match || !match[1]) {
    throw new AppError(StatusCodes.BAD_GATEWAY, "Invalid Cloudinary URL");
  }

  // match[1] contains the public ID
  const publicId = match[1];

  try {
    await cloudinary.uploader.destroy(publicId);

    // console.log(`Deleted image from Cloudinary: ${publicId}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const cloudinaryUpload = cloudinary;
