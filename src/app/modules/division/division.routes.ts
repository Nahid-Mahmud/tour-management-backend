import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserRole } from "../user/user.interface";
import { divisionControllers } from "./division.controller";
import { createDivisionSchema, updateDivisionSchema } from "./division.validation";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.get("/", divisionControllers.getAllDivisions);

router.post(
  "/create",
  checkAuth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  multerUpload.single("file"),
  validateRequest(createDivisionSchema),
  divisionControllers.createDivision
);

router.get("/:slug", divisionControllers.getDivisionBySlug);

router.patch(
  "/:id",
  checkAuth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  multerUpload.single("file"),
  validateRequest(updateDivisionSchema),
  divisionControllers.updateDivision
);

router.delete("/:id", checkAuth(UserRole.SUPER_ADMIN, UserRole.ADMIN), divisionControllers.deleteDivision);

export const divisionRoutes = router;
