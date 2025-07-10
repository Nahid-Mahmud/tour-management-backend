import { Router } from "express";
import { userControllers } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createUserSchema } from "./user.validation";

const router = Router();

router.post("/register", validateRequest(createUserSchema), userControllers.createUser);
router.get("/", userControllers.getAllUsers);

export const userRoutes = router;
