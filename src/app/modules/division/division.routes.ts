import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserRole } from "../user/user.interface";
import { divisionControllers } from "./division.controller";
import { createDivisionSchema, updateDivisionSchema } from "./division.validation";

const router = Router();

router.get("/", divisionControllers.getAllDivisions);
router.post(
  "/create",
  checkAuth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(createDivisionSchema),
  divisionControllers.createDivision
);

router.get("/:slug", divisionControllers.getDivisionBySlug);

router.patch(
  "/:id",
  checkAuth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(updateDivisionSchema),
  divisionControllers.updateDivision
);

router.delete("/:id", checkAuth(UserRole.SUPER_ADMIN, UserRole.ADMIN), divisionControllers.deleteDivision);

export const divisionRoutes = router;
