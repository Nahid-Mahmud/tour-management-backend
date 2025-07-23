import { Router } from "express";

const router = Router();

router.post("/success");
router.post("/fail");
router.post("/cancel");

const paymentRoutes = router;
export default paymentRoutes;
