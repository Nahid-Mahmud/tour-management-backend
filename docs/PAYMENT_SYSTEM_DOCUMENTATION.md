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

### SSLCommerz Service (`sslCommerz.service.ts`)

The SSLCommerz service handles payment initialization with the SSLCommerz payment gateway.

#### Interface Definition

```typescript
interface ISSLCommerz {
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

**Response:**
Returns SSLCommerz gateway response containing `GatewayPageURL` for payment redirection.

## Payment Module

### Payment Interface (`payment.interface.ts`)

```typescript
enum PAYMENT_STATUS {
  PAID = "PAID",
  UNPAID = "UNPAID",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

interface IPayment {
  booking: Types.ObjectId;
  transactionId: string;
  amount: number;
  paymentGatewayData?: any;
  invoiceUrl?: string;
  status: PAYMENT_STATUS;
}
```

### Payment Service (`payment.service.ts`)

#### Core Functions

##### `initPayment(bookingId: string)`

Initializes payment for an existing booking.

**Process:**

1. Validates payment record exists for the booking
2. Retrieves booking details with populated user information
3. Constructs SSLCommerz payload from user and payment data
4. Calls SSLCommerz payment initialization
5. Returns payment URL for redirection

**Returns:**

```typescript
{
  paymentUrl: string; // SSLCommerz gateway URL
}
```

##### `successPayment(query: Record<string, string>)`

Handles successful payment callback from SSLCommerz.

**Process:**

1. Starts database transaction
2. Updates payment status to `PAID`
3. Updates booking status to `COMPLETED`
4. Commits transaction on success
5. Returns success response

**Transaction Safety:**

- Uses MongoDB sessions for atomic operations
- Automatic rollback on failure
- Proper session cleanup

##### `failPayment(query: Record<string, string>)`

Handles failed payment callback.

**Process:**

1. Updates payment status to `FAILED`
2. Updates booking status to `FAILED`
3. Uses transaction for data consistency

##### `cancelPayment(query: Record<string, string>)`

Handles cancelled payment callback.

**Process:**

1. Updates payment status to `CANCELLED`
2. Updates booking status to `CANCEL`
3. Maintains transaction integrity

### Payment Controller (`payment.controller.ts`)

#### Endpoints

##### `POST /init-payment/:bookingId`

Initializes payment for a booking.

##### `POST /success`

Handles successful payment callback and redirects to frontend success page.

##### `POST /fail`

Handles failed payment callback and redirects to frontend failure page.

##### `POST /cancel`

Handles cancelled payment callback and redirects to frontend cancellation page.

## Booking Module

### Booking Interface (`booking.interface.ts`)

```typescript
enum BOOKING_STATUS {
  PENDING = "PENDING",
  CANCEL = "CANCEL",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

interface IBooking {
  user: Types.ObjectId;
  tour: Types.ObjectId;
  payment?: Types.ObjectId;
  guestCount: number;
  status: BOOKING_STATUS;
}
```

### Booking Service (`booking.service.ts`)

#### Core Functions

##### `createBooking(payload: Partial<IBooking>, userId: string)`

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

Generates unique transaction IDs using crypto.randomBytes for security.

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

### Booking Endpoints

- `POST /api/v1/booking` - Create new booking
- `GET /api/v1/booking` - Get all bookings (Admin only)
- `GET /api/v1/booking/my-bookings` - Get user's bookings
- `GET /api/v1/booking/:bookingId` - Get single booking
- `PATCH /api/v1/booking/:bookingId/status` - Update booking status

### Payment Endpoints

- `POST /api/v1/payment/init-payment/:bookingId` - Initialize payment
- `POST /api/v1/payment/success` - Success callback
- `POST /api/v1/payment/fail` - Failure callback
- `POST /api/v1/payment/cancel` - Cancellation callback

## Environment Configuration

### Required SSL Environment Variables

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

```typescript
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

```typescript
const session = await Model.startSession();
session.startTransaction();
try {
  // Perform operations with session
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  await session.endSession();
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
