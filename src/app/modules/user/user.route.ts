import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { userControllers } from "./user.controller";
import { UserRole } from "./user.interface";
import { createUserSchema } from "./user.validation";

const router = Router();

router.post("/register", validateRequest(createUserSchema), userControllers.createUser);
router.get("/", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), userControllers.getAllUsers);

export const userRoutes = router;
