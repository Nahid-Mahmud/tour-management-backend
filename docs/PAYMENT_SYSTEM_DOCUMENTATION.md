# Tour Management Payment System Documentation

This documentation covers the SSLCommerz payment integration, payment module, and booking module for the Tour Management Backend system.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [SSLCommerz Payment Integration](#sslcommerz-payment-integration)
4. [Payment Module](#payment-module)
5. [Booking Module](#booking-module)
6. [Payment Flow](#payment-flow)
7. [API Endpoints](#api-endpoints)
8. [Environment Configuration](#environment-configuration)
9. [Error Handling](#error-handling)
10. [Database Transactions](#database-transactions)

## Overview

The payment system integrates SSLCommerz payment gateway with a comprehensive booking and payment management system. It supports tour bookings with secure payment processing, status tracking, and automatic status updates based on payment outcomes.

## Architecture

The system follows a modular architecture with three main components:

- **SSLCommerz Service**: Handles payment gateway integration
- **Payment Module**: Manages payment records and status updates
- **Booking Module**: Manages tour bookings and coordinates with payments

## SSLCommerz Payment Integration

### SSLCommerz Service (`src/app/modules/sslCommerz/sslCommerz.service.ts`)

The SSLCommerz service handles payment initialization with the SSLCommerz payment gateway.

#### Interface Definition (`src/app/modules/sslCommerz/sslCommerz.interface.ts`)

```typescript
export interface ISSLCommerz {
  amount: number;
  transactionId: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
}
```

#### Key Functions

##### `sslPaymentInit(payload: ISSLCommerz)`

**File:** `src/app/modules/sslCommerz/sslCommerz.service.ts` (Lines 7-83)

Initializes a payment session with SSLCommerz gateway.

**Parameters:**

- `payload`: Payment details including amount, transaction ID, and customer information

**Process:**

1. Constructs payment data with SSLCommerz required fields
2. Sets up success, fail, and cancel URLs with query parameters
3. Makes HTTP POST request to SSLCommerz payment API
4. Returns payment gateway response with payment URL

**Key Features:**

- Uses environment variables for secure configuration
- Supports both Axios and Fetch API methods (Axios is currently active)
- Includes comprehensive customer and shipping information
- Automatic URL generation with transaction tracking parameters

**Code Implementation:**

```typescript
// From src/app/modules/sslCommerz/sslCommerz.service.ts
const sslPaymentInit = async (payload: ISSLCommerz) => {
  try {
    const data = {
      store_id: envVariables.SSL.SSL_STORE_ID,
      store_passwd: envVariables.SSL.SSL_STORE_PASSWORD,
      total_amount: payload.amount,
      currency: "BDT",
      tran_id: payload.transactionId,
      success_url: `${envVariables.SSL.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=success`,
      fail_url: `${envVariables.SSL.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=fail`,
      cancel_url: `${envVariables.SSL.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=cancel`,
      // Customer information
      cus_name: payload.name,
      cus_email: payload.email,
      cus_add1: payload.address,
      cus_phone: payload.phoneNumber,
      // ... other required fields
    };

    const response = await axios({
      method: "POST",
      url: envVariables.SSL.SSL_PAYMENT_API,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
    });

    return response.data;
  } catch (error: any) {
    console.log("SSLCommerz payment initialization error:", error);
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};
```

**Response:**
Returns SSLCommerz gateway response containing `GatewayPageURL` for payment redirection.

## Payment Module

### Payment Interface (`src/app/modules/payment/payment.interface.ts`)

```typescript
import { Types } from "mongoose";

export enum PAYMENT_STATUS {
  PAID = "PAID",
  UNPAID = "UNPAID",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export interface IPayment {
  booking: Types.ObjectId;
  transactionId: string;
  amount: number;
  paymentGatewayData?: any;
  invoiceUrl?: string;
  status: PAYMENT_STATUS;
}
```

### Payment Service (`src/app/modules/payment/payment.service.ts`)

#### Core Functions

##### `initPayment(bookingId: string)`

**File:** `src/app/modules/payment/payment.service.ts` (Lines 12-36)

Initializes payment for an existing booking.

**Process:**

1. Validates payment record exists for the booking
2. Retrieves booking details with populated user information
3. Constructs SSLCommerz payload from user and payment data
4. Calls SSLCommerz payment initialization
5. Returns payment URL for redirection

**Code Implementation:**

```typescript
// From src/app/modules/payment/payment.service.ts
const initPayment = async (bookingId: string) => {
  // Check if booking exists in the payment service
  const payment = await Payment.findOne({ booking: bookingId });

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found. You have not booked this tour yet.");
  }

  const booking = await Booking.findById(payment.booking).populate("user", "name email phone address");

  const userAddress = (booking?.user as any).address as string;
  const userEmail = (booking?.user as any).email as string;
  const userPhone = (booking?.user as any).phone as string;
  const userName = (booking?.user as any).name as string;

  const sslPayload: ISSLCommerz = {
    address: userAddress,
    email: userEmail,
    name: userName,
    phoneNumber: userPhone,
    amount: payment.amount,
    transactionId: payment.transactionId,
  };

  const sslPayment = await SSLService.sslPaymentInit(sslPayload);

  return {
    paymentUrl: sslPayment.GatewayPageURL,
  };
};
```

**Returns:**

```typescript
{
  paymentUrl: string; // SSLCommerz gateway URL
}
```

##### `successPayment(query: Record<string, string>)`

**File:** `src/app/modules/payment/payment.service.ts` (Lines 38-75)

Handles successful payment callback from SSLCommerz.

**Process:**

1. Starts database transaction
2. Updates payment status to `PAID`
3. Updates booking status to `COMPLETED`
4. Commits transaction on success
5. Returns success response

**Code Implementation:**

```typescript
// From src/app/modules/payment/payment.service.ts
const successPayment = async (query: Record<string, string>) => {
  // update booking status to confirm
  // update payment status to paid

  const session = await Booking.startSession();
  session.startTransaction();
  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      {
        transactionId: query.transactionId,
      },
      {
        status: PAYMENT_STATUS.PAID,
      },
      {
        session,
        new: true,
        runValidators: true,
      }
    );

    await Booking.findByIdAndUpdate(
      updatedPayment?.booking,
      {
        status: BOOKING_STATUS.COMPLETED,
      },
      {
        session,
        runValidators: true,
      }
    );

    await session.commitTransaction();

    return {
      success: true,
      message: "Payment Completed Successfully",
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
```

**Transaction Safety:**

- Uses MongoDB sessions for atomic operations
- Automatic rollback on failure
- Proper session cleanup

##### `failPayment(query: Record<string, string>)`

**File:** `src/app/modules/payment/payment.service.ts` (Lines 77-114)

Handles failed payment callback.

**Process:**

1. Updates payment status to `FAILED`
2. Updates booking status to `FAILED`
3. Uses transaction for data consistency

##### `cancelPayment(query: Record<string, string>)`

**File:** `src/app/modules/payment/payment.service.ts` (Lines 116-153)

Handles cancelled payment callback.

**Process:**

1. Updates payment status to `CANCELLED`
2. Updates booking status to `CANCEL`
3. Maintains transaction integrity

### Payment Controller (`src/app/modules/payment/payment.controller.ts`)

#### Endpoints

##### `POST /init-payment/:bookingId`

**File:** `src/app/modules/payment/payment.controller.ts` (Lines 8-16)
Initializes payment for a booking.

```typescript
// From src/app/modules/payment/payment.controller.ts
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
```

##### `POST /success`

**File:** `src/app/modules/payment/payment.controller.ts` (Lines 18-30)
Handles successful payment callback and redirects to frontend success page.

##### `POST /fail`

**File:** `src/app/modules/payment/payment.controller.ts` (Lines 32-43)
Handles failed payment callback and redirects to frontend failure page.

##### `POST /cancel`

**File:** `src/app/modules/payment/payment.controller.ts` (Lines 45-56)
Handles cancelled payment callback and redirects to frontend cancellation page.

## Booking Module

### Booking Interface (`src/app/modules/booking/booking.interface.ts`)

```typescript
import { Types } from "mongoose";

export enum BOOKING_STATUS {
  PENDING = "PENDING",
  CANCEL = "CANCEL",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface IBooking {
  user: Types.ObjectId;
  tour: Types.ObjectId;
  payment?: Types.ObjectId;
  guestCount: number;
  status: BOOKING_STATUS;
}
```

### Booking Service (`src/app/modules/booking/booking.service.ts`)

#### Core Functions

##### `createBooking(payload: Partial<IBooking>, userId: string)`

**File:** `src/app/modules/booking/booking.service.ts` (Lines 21-110)

Creates a new booking with integrated payment initialization.

**Process:**

1. **Validation Phase:**

   - Validates guest count is positive
   - Checks user has phone and address in profile
   - Verifies tour exists and retrieves cost

2. **Transaction Phase:**

   - Generates unique transaction ID using crypto
   - Creates booking record with `PENDING` status
   - Creates payment record with `UNPAID` status
   - Links payment to booking

3. **Payment Integration:**

   - Constructs SSLCommerz payment payload
   - Initializes payment with SSLCommerz
   - Returns both booking details and payment URL

**Code Implementation:**

```typescript
// From src/app/modules/booking/booking.service.ts
const createBooking = async (payload: Partial<IBooking>, userId: string) => {
  const session = await Booking.startSession();

  // validate payload
  if (!payload.guestCount || payload.guestCount <= 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Guest count must be a positive integer");
  }

  const transactionId = getTransactionId();

  // start session
  session.startTransaction();
  try {
    const user = await User.findById(userId);
    if (!user?.phone || !user?.address) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Please Update you profile with phone and address");
    }

    const tour = await Tour.findById(payload.tour).select("constFrom");
    if (!tour?.constFrom) {
      throw new AppError(StatusCodes.NOT_FOUND, "Tour not found");
    }

    const amount = Number(tour.constFrom) * Number(payload.guestCount);

    // Create booking
    const booking = await Booking.create(
      [
        {
          user: userId,
          status: BOOKING_STATUS.PENDING,
          ...payload,
        },
      ],
      { session }
    );

    // Create payment
    const payment = await Payment.create(
      [
        {
          booking: booking[0]._id,
          status: PAYMENT_STATUS.UNPAID,
          transactionId: transactionId,
          amount: amount,
        },
      ],
      { session }
    );

    // Update booking with payment reference
    const updatedBooking = await Booking.findByIdAndUpdate(
      booking[0]._id,
      { payment: payment[0]._id },
      { new: true, runValidators: true, session: session }
    )
      .populate("user", "name email phone address")
      .populate("tour", "title constFrom")
      .populate("payment");

    // Prepare SSL payload
    const sslPayload: ISSLCommerz = {
      address: (updatedBooking?.user as any).address,
      email: (updatedBooking?.user as any).email,
      name: (updatedBooking?.user as any).name,
      phoneNumber: (updatedBooking?.user as any).phone,
      amount: amount,
      transactionId: transactionId,
    };

    const sslPayment = await SSLService.sslPaymentInit(sslPayload);
    await session.commitTransaction();

    return {
      booking: updatedBooking,
      payment: sslPayment.GatewayPageURL,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

4. **Response:**

```typescript
{
  booking: IBooking; // Populated booking object
  payment: string; // SSLCommerz payment URL
}
```

**Key Features:**

- Atomic transaction handling
- Automatic amount calculation based on tour cost and guest count
- Immediate payment initialization
- Comprehensive error handling with rollback

#### Utility Functions

##### `getTransactionId()`

**File:** `src/app/modules/booking/booking.service.ts` (Lines 14-19)

Generates unique transaction IDs using crypto.randomBytes for security.

**Code Implementation:**

```typescript
// From src/app/modules/booking/booking.service.ts
const getTransactionId = () => {
  const cryptoId = crypto.randomBytes(12).toString("hex");
  return `tran_${cryptoId}`;
};
```

Format: `tran_${cryptoHexString}`

## Payment Flow

### Complete Payment Process

1. **Booking Creation:**

   ```
   User → POST /booking → Creates booking + payment records → Returns payment URL
   ```

2. **Payment Processing:**

   ```
   User → Redirected to SSLCommerz → Completes payment → Callback to backend
   ```

3. **Payment Completion:**
   ```
   SSLCommerz → Callback URL → Updates payment/booking status → Redirects to frontend
   ```

### Status Transitions

#### Booking Status Flow:

```
PENDING → COMPLETED (success)
PENDING → FAILED (payment failure)
PENDING → CANCEL (user cancellation)
```

#### Payment Status Flow:

```
UNPAID → PAID (success)
UNPAID → FAILED (payment failure)
UNPAID → CANCELLED (user cancellation)
```

## API Endpoints

### Booking Endpoints (`src/app/modules/booking/booking.route.ts`)

- `POST /api/v1/booking` - Create new booking
- `GET /api/v1/booking` - Get all bookings (Admin only)
- `GET /api/v1/booking/my-bookings` - Get user's bookings
- `GET /api/v1/booking/:bookingId` - Get single booking
- `PATCH /api/v1/booking/:bookingId/status` - Update booking status

**Route Implementation:**

```typescript
// From src/app/modules/booking/booking.route.ts
router.post(
  "/",
  checkAuth(...Object.values(UserRole)),
  validateRequest(createBookingZodSchema),
  BookingController.createBooking
);

router.get("/", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), BookingController.getAllBookings);
router.get("/my-bookings", checkAuth(...Object.values(UserRole)), BookingController.getUserBookings);
router.get("/:bookingId", checkAuth(...Object.values(UserRole)), BookingController.getSingleBooking);
router.patch(
  "/:bookingId/status",
  checkAuth(...Object.values(UserRole)),
  validateRequest(updateBookingZodSchema),
  BookingController.updateBookingStatus
);
```

### Payment Endpoints (`src/app/modules/payment/payment.route.ts`)

- `POST /api/v1/payment/init-payment/:bookingId` - Initialize payment
- `POST /api/v1/payment/success` - Success callback
- `POST /api/v1/payment/fail` - Failure callback
- `POST /api/v1/payment/cancel` - Cancellation callback

**Route Implementation:**

```typescript
// From src/app/modules/payment/payment.route.ts
router.post("/init-payment/:bookingId", paymentController.initPayment);
router.post("/success", paymentController.successPayment);
router.post("/fail", paymentController.failPayment);
router.post("/cancel", paymentController.cancelPayment);
```

## Environment Configuration

### Required SSL Environment Variables (`src/app/config/env.ts`)

**File Reference:** `src/app/config/env.ts` (Lines 27-39)

```env
# SSLCommerz Configuration
SSL_STORE_ID=your_store_id
SSL_STORE_PASSWORD=your_store_password
SSL_PAYMENT_API=https://sandbox.sslcommerz.com/gwprocess/v4/api.php
SSL_VALIDATION_API=validation_endpoint

# Backend Callback URLs
SSL_SUCCESS_BACKEND_URL=http://localhost:3000/api/v1/payment/success
SSL_FAIL_BACKEND_URL=http://localhost:3000/api/v1/payment/fail
SSL_CANCEL_BACKEND_URL=http://localhost:3000/api/v1/payment/cancel

# Frontend Redirect URLs
SSL_SUCCESS_FRONTEND_URL=http://localhost:3001/payment/success
SSL_FAIL_FRONTEND_URL=http://localhost:3001/payment/failure
SSL_CANCEL_FRONTEND_URL=http://localhost:3001/payment/cancelled
```

**Environment Interface:**

```typescript
// From src/app/config/env.ts
interface EnvVariables {
  // ... other variables
  SSL: {
    SSL_STORE_ID: string;
    SSL_STORE_PASSWORD: string;
    SSL_PAYMENT_API: string;
    SSL_VALIDATION_API: string;
    SSL_SUCCESS_BACKEND_URL: string;
    SSL_FAIL_BACKEND_URL: string;
    SSL_CANCEL_BACKEND_URL: string;
    SSL_SUCCESS_FRONTEND_URL: string;
    SSL_FAIL_FRONTEND_URL: string;
    SSL_CANCEL_FRONTEND_URL: string;
  };
}
```

## Error Handling

### Common Error Scenarios

1. **User Profile Incomplete:**

   - Error: "Please Update you profile with phone and address"
   - Status: 400 Bad Request

2. **Invalid Guest Count:**

   - Error: "Guest count must be a positive integer"
   - Status: 400 Bad Request

3. **Tour Not Found:**

   - Error: "Tour not found"
   - Status: 404 Not Found

4. **Payment Not Found:**

   - Error: "Payment not found. You have not booked this tour yet."
   - Status: 404 Not Found

5. **SSLCommerz Integration Error:**
   - Logs error details
   - Throws AppError with 500 status

### Error Response Format

**File Reference:** Global error handler patterns used across the application

```typescript
// Standard error response format used in src/app/middlewares/globalErrorHandler.ts
{
  success: false,
  message: string,
  errorSources?: Array<{
    path: string;
    message: string;
  }>,
  stack?: string
}
```

**AppError Implementation:**

```typescript
// From src/app/errorHelpers/AppError.ts
class AppError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string, stack = "") {
    super(message);
    this.statusCode = statusCode;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
```

## Database Transactions

### Transaction Usage

The system uses MongoDB transactions to ensure data consistency across multiple collections:

1. **Booking Creation Transaction:**

   - Creates booking record
   - Creates payment record
   - Links records together
   - Rollback on any failure

2. **Payment Status Update Transaction:**
   - Updates payment status
   - Updates corresponding booking status
   - Maintains referential integrity

### Transaction Pattern

**Implementation used across payment and booking services:**

```typescript
// Pattern used in src/app/modules/booking/booking.service.ts and src/app/modules/payment/payment.service.ts
const session = await Model.startSession();
session.startTransaction();
try {
  // Perform operations with session
  const result1 = await Model1.create([data], { session });
  const result2 = await Model2.findByIdAndUpdate(id, updateData, { session });

  await session.commitTransaction();
  return results;
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  await session.endSession();
}
```

**Real Example from Booking Service:**

```typescript
// From src/app/modules/booking/booking.service.ts (Lines 27-110)
const session = await Booking.startSession();
session.startTransaction();
try {
  const booking = await Booking.create(
    [
      {
        user: userId,
        status: BOOKING_STATUS.PENDING,
        ...payload,
      },
    ],
    { session }
  );

  const payment = await Payment.create(
    [
      {
        booking: booking[0]._id,
        status: PAYMENT_STATUS.UNPAID,
        transactionId: transactionId,
        amount: amount,
      },
    ],
    { session }
  );

  await session.commitTransaction();
  // ... return results
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## Security Considerations

1. **Transaction ID Generation:** Uses cryptographically secure random bytes
2. **Environment Variables:** Sensitive data stored in environment variables
3. **Input Validation:** Zod schema validation on all inputs
4. **Authentication:** Protected endpoints with JWT authentication
5. **Error Handling:** Detailed logging without exposing sensitive information

## Best Practices

1. **Always use transactions** for operations spanning multiple collections
2. **Validate user profile completeness** before allowing bookings
3. **Generate unique transaction IDs** for each payment
4. **Handle all payment gateway callbacks** (success, fail, cancel)
5. **Maintain status consistency** between bookings and payments
6. **Use proper error handling** with appropriate HTTP status codes
7. **Log payment gateway errors** for debugging while maintaining security

This documentation provides a comprehensive overview of the payment system architecture and implementation details for the Tour Management Backend.

## File Structure Reference

### Core Payment Files

```
src/app/modules/
├── sslCommerz/
│   ├── sslCommerz.interface.ts     # SSLCommerz payload interface
│   └── sslCommerz.service.ts       # Payment gateway integration
├── payment/
│   ├── payment.interface.ts        # Payment status enum & interface
│   ├── payment.model.ts            # Payment MongoDB schema
│   ├── payment.service.ts          # Payment business logic
│   ├── payment.controller.ts       # Payment HTTP handlers
│   ├── payment.route.ts            # Payment API routes
│   └── payment.validation.ts       # Payment input validation
└── booking/
    ├── booking.interface.ts         # Booking status enum & interface
    ├── booking.model.ts            # Booking MongoDB schema
    ├── booking.service.ts          # Booking business logic
    ├── booking.controller.ts       # Booking HTTP handlers
    ├── booking.route.ts            # Booking API routes
    └── booking.validation.ts       # Booking input validation
```

### Supporting Files

```
src/app/
├── config/
│   └── env.ts                      # Environment configuration
├── errorHelpers/
│   └── AppError.ts                 # Custom error class
├── middlewares/
│   ├── globalErrorHandler.ts      # Global error handling
│   ├── checkAuth.ts               # Authentication middleware
│   └── validateRequest.ts         # Request validation middleware
└── utils/
    ├── catchAsync.ts              # Async error wrapper
    └── sendResponse.ts            # Standard response format
```

### Key Integration Points

- **Transaction Management**: MongoDB sessions in booking and payment services
- **Authentication**: JWT-based auth in routes (`checkAuth` middleware)
- **Validation**: Zod schemas for input validation
- **Error Handling**: Centralized error handling with `AppError` class
- **Response Format**: Standardized API responses with `sendResponse` utility
