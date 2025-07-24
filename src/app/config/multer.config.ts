import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: {
    public_id: (req, file) => {
      // sanitize the original file name to avoid issues with space , (.) and other special characters
      const sanitizedFileName = file.originalname
        .toLowerCase()
        .replace(/\s+/g, "-") // replace spaces with hyphens
        .replace(/\./g, "-") // replace dots with hyphens
        // eslint-disable-next-line no-useless-escape
        .replace(/[^a-z0-9\-\.]/g, ""); // remove any other special characters

      // get the current file extension
      const fileExtension = file.originalname.split(".").pop();

      //   create unique file name

      const uniqueFileName =
        Math.random().toString(36).substring(2) + "-" + Date.now() + "-" + sanitizedFileName + "." + fileExtension;

      return uniqueFileName;
    },
  },
});

export const multerUpload = multer({
  storage: storage,
});
