import { Router } from "express";
import { paymentController } from "./payment.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";

const router = Router();

router.post("/init-payment/:bookingId", paymentController.initPayment);
router.post("/success", paymentController.successPayment);
router.post("/fail", paymentController.failPayment);
router.post("/cancel", paymentController.cancelPayment);
router.get("/invoice/:paymentId", checkAuth(...Object.values(UserRole)), paymentController.getInvoiceDownloadUrl);
// router.post("/validate-request", paymentController.validateRequest);

const paymentRoutes = router;
export default paymentRoutes;
