/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { paymentService } from "./payment.service";
import envVariables from "../../config/env";
import sendResponse from "../../utils/sendResponse";

const initPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const bookingId = req.params.bookingId;
  const result = await paymentService.initPayment(bookingId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment initialized successfully",
    data: result,
  });
});

const successPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const query = req.query;

  const result = await paymentService.successPayment(query as Record<string, string>);

  if (result.success) {
    res.redirect(
      `${envVariables.SSL.SSL_SUCCESS_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`
    );
  }

  //
});

const failPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //
  const query = req.query;

  const result = await paymentService.failPayment(query as Record<string, string>);

  if (!result.success) {
    res.redirect(
      `${envVariables.SSL.SSL_FAIL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`
    );
  }
});

const cancelPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //
  const query = req.query;

  const result = await paymentService.cancelPayment(query as Record<string, string>);

  if (!result.success) {
    res.redirect(
      `${envVariables.SSL.SSL_CANCEL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`
    );
  }
});

const getInvoiceDownloadUrl = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const paymentId = req.params.paymentId;

  const result = await paymentService.getInvoiceDownloadUrl(paymentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Invoice URL retrieved successfully",
    data: result,
  });
});

// const validateRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//   console.log("message form validate request", req.body);
//   // redirect to success page
// //
// });

export const paymentController = {
  successPayment,
  failPayment,
  cancelPayment,
  initPayment,
  getInvoiceDownloadUrl,
  // validateRequest,
};
