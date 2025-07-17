import { Router } from "express";
import { divisionControllers } from "./division.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";

const router = Router();

router.post("/create", checkAuth(UserRole.SUPER_ADMIN, UserRole.ADMIN), divisionControllers.createDivision);

export const divisionRoutes = router;
