import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { userControllers } from "./user.controller";
import { UserRole } from "./user.interface";
import { createUserSchema, updateUserSchema } from "./user.validation";

const router = Router();

router.post("/register", validateRequest(createUserSchema), userControllers.createUser);
router.get("/", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), userControllers.getAllUsers);

router.get("/me", checkAuth(...Object.values(UserRole)), userControllers.getMe); // Assuming this is for the logged-in user

router.get("/:userId", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), userControllers.getUserById);
router.patch(
  "/:userId",
  checkAuth(...Object.values(UserRole)),
  validateRequest(updateUserSchema),
  userControllers.updateUser
);

export const userRoutes = router;
