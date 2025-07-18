import { Router } from "express";
import { TourController } from "./tour.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { createTourTypeZodSchema, createTourZodSchema, updateTourZodSchema } from "./tour.validation";

const router = Router();

// ----------------------------- Tour Type ---------------------------- //
router.post(
  "/create-tour-type",
  validateRequest(createTourTypeZodSchema),
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TourController.createTourType
);
router.patch(
  "/tour-types/:id",
  validateRequest(updateTourZodSchema),
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TourController.editTourType
);
router.get("/tour-types", TourController.getAllTourTypes);
router.delete("/tour-types/:id", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), TourController.deleteTourType);
// ----------------------------- Tour ---------------------------- //
router.post(
  "/create",
  validateRequest(createTourZodSchema),
  checkAuth(...Object.values(UserRole)),
  TourController.createTour
);

router.get("/", checkAuth(...Object.values(UserRole)), TourController.getAllTours);

export const TourRoutes = router;
