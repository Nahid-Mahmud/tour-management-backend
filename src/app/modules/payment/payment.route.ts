import { Router } from "express";
import { paymentController } from "./payment.controller";

const router = Router();

router.post("/init-payment/:bookingId", paymentController.initPayment);
router.post("/success", paymentController.successPayment);
router.post("/fail", paymentController.failPayment);
router.post("/cancel", paymentController.cancelPayment);
router.post("validate-request", () => {
  //
});

const paymentRoutes = router;
export default paymentRoutes;
