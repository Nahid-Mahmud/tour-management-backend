import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserRole } from "../user/user.interface";
import { TourController } from "./tour.controller";
import {
  createTourTypeZodSchema,
  createTourZodSchema,
  updateTourTypeZodSchema,
  updateTourZodSchema,
} from "./tour.validation";

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
  validateRequest(updateTourTypeZodSchema),
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

router.patch(
  "/:id",
  validateRequest(updateTourZodSchema),
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TourController.updateTour
);

router.delete(
  "/:id",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.USER, UserRole.GUIDE),
  TourController.deleteTour
);

export const TourRoutes = router;
