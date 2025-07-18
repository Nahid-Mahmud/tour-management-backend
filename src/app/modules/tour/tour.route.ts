import { Router } from "express";
import { TourController } from "./tour.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";

const router = Router();

// ----------------------------- Tour Type ---------------------------- //
router.post("/create-tour-type", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), TourController.createTourType);
router.patch("/tour-types/:id", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), TourController.editTourType);
router.get("/tour-types", TourController.getAllTourTypes);
router.delete("/tour-types/:id", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), TourController.deleteTourType);
// ----------------------------- Tour ---------------------------- //










export const TourRoutes = router;
