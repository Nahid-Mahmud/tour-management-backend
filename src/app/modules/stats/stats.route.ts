import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import { statsController } from "./stats.controller";

const router = Router();

router.get("/booking", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), statsController.getBookingStats);
router.get("/tour", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), statsController.getTourStats);
router.get("/user", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), statsController.getUserStats);
router.get("/payment", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), statsController.getPaymentStats);

export const statsRoutes = router;
