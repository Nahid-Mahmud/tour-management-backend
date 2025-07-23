# SSLCommerz Payment Gateway Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Environment Configuration](#environment-configuration)
5. [Project Structure](#project-structure)
6. [Implementation Details](#implementation-details)
7. [Payment Flow](#payment-flow)
8. [Testing](#testing)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Overview

This guide covers the integration of SSLCommerz payment gateway in a Node.js/Express.js application with MongoDB for a tour management system. SSLCommerz is a popular payment gateway in Bangladesh that supports multiple payment methods including credit/debit cards, mobile banking, and internet banking.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- SSLCommerz merchant account
- Basic knowledge of TypeScript/JavaScript
- Express.js framework

## Installation & Setup

### 1. Create SSLCommerz Account
1. Visit [SSLCommerz website](https://www.sslcommerz.com/)
2. Register for a merchant account
3. Complete the verification process
4. Obtain your Store ID and Store Password

### 2. Install Required Dependencies

```bash
npm install crypto axios
# or
yarn add crypto axios
```

## Environment Configuration

Create or update your `.env` file with SSLCommerz credentials:

```env
# SSLCommerz Configuration
SSLCOMMERZ_STORE_ID=your_store_id_here
SSLCOMMERZ_STORE_PASSWORD=your_store_password_here
SSLCOMMERZ_IS_LIVE=false  # Set to true for production

# SSLCommerz URLs
SSLCOMMERZ_INIT_URL=https://sandbox.sslcommerz.com/gwprocess/v3/api.php  # Sandbox
SSLCOMMERZ_VALIDATION_URL=https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php

# For Production, use:
# SSLCOMMERZ_INIT_URL=https://securepay.sslcommerz.com/gwprocess/v3/api.php
# SSLCOMMERZ_VALIDATION_URL=https://securepay.sslcommerz.com/validator/api/validationserverAPI.php

# Callback URLs
SUCCESS_URL=http://localhost:5000/api/payment/success
FAIL_URL=http://localhost:5000/api/payment/fail
CANCEL_URL=http://localhost:5000/api/payment/cancel
IPN_URL=http://localhost:5000/api/payment/ipn
```

## Project Structure

```
src/
├── app/
│   ├── modules/
│   │   ├── booking/
│   │   │   ├── booking.interface.ts
│   │   │   ├── booking.model.ts
│   │   │   ├── booking.service.ts
│   │   │   └── booking.controller.ts
│   │   ├── payment/
│   │   │   ├── payment.interface.ts
│   │   │   ├── payment.model.ts
│   │   │   ├── payment.service.ts
│   │   │   └── payment.controller.ts
│   │   └── sslCommerz/
│   │       ├── sslCommerz.interface.ts
│   │       ├── sslCommerz.service.ts
│   │       └── sslCommerz.controller.ts
│   └── errorHelpers/
│       └── AppError.ts
```

## Implementation Details

### 0. Do not forget to add this code in app.ts

```typescript
// need to handle urlencoded data form form or SSLCommerz
app.use(express.urlencoded({ extended: true }));
```

### 1. SSLCommerz Interface Definition

```typescript
// src/app/modules/sslCommerz/sslCommerz.interface.ts
export interface ISSLCommerz {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  amount: number;
  transactionId: string;
  productName?: string;
  productCategory?: string;
  productProfile?: string;
}

export interface ISSLCommerzResponse {
  status: string;
  failedreason?: string;
  sessionkey: string;
  gw: string;
  redirectGatewayURL: string;
  redirectGatewayURL2?: string;
  GatewayPageURL: string;
  storeBanner?: string;
  storeLogo?: string;
  store_name?: string;
  desc?: string;
  is_direct_pay_enable?: string;
}
```

### 2. Payment Interface Definition

```typescript
// src/app/modules/payment/payment.interface.ts
export enum PAYMENT_STATUS {
  UNPAID = 'unpaid',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export interface IPayment {
  booking: Types.ObjectId;
  status: PAYMENT_STATUS;
  transactionId: string;
  amount: number;
  gatewayData?: any;
  paidAt?: Date;
  refundedAt?: Date;
}
```

### 3. SSLCommerz Service Implementation

```typescript
// src/app/modules/sslCommerz/sslCommerz.service.ts
import axios from 'axios';
import { ISSLCommerz, ISSLCommerzResponse } from './sslCommerz.interface';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes } from 'http-status-codes';

const sslPaymentInit = async (payload: ISSLCommerz): Promise<ISSLCommerzResponse> => {
  try {
    const data = {
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
      total_amount: payload.amount,
      currency: 'BDT',
      tran_id: payload.transactionId,
      success_url: process.env.SUCCESS_URL,
      fail_url: process.env.FAIL_URL,
      cancel_url: process.env.CANCEL_URL,
      ipn_url: process.env.IPN_URL,
      shipping_method: 'NO',
      product_name: payload.productName || 'Tour Booking',
      product_category: payload.productCategory || 'Travel',
      product_profile: payload.productProfile || 'general',
      cus_name: payload.name,
      cus_email: payload.email,
      cus_add1: payload.address,
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: payload.phoneNumber,
      ship_name: payload.name,
      ship_add1: payload.address,
      ship_city: 'Dhaka',
      ship_state: 'Dhaka',
      ship_postcode: '1000',
      ship_country: 'Bangladesh',
    };

    const response = await axios({
      method: 'post',
      url: process.env.SSLCOMMERZ_INIT_URL,
      data: data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.data.status === 'FAILED') {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        response.data.failedreason || 'Payment initialization failed'
      );
    }

    return response.data;
  } catch (error: any) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message || 'Payment gateway error'
    );
  }
};

const validatePayment = async (transactionId: string): Promise<any> => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${process.env.SSLCOMMERZ_VALIDATION_URL}?val_id=${transactionId}&store_id=${process.env.SSLCOMMERZ_STORE_ID}&store_passwd=${process.env.SSLCOMMERZ_STORE_PASSWORD}&format=json`,
    });

    return response.data;
  } catch (error: any) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Payment validation failed'
    );
  }
};

export const SSLService = {
  sslPaymentInit,
  validatePayment,
};
```

### 4. Transaction ID Generation

Your current implementation uses crypto for generating unique transaction IDs:

```typescript
// Secure transaction ID generation
const getTransactionId = (): string => {
  const cryptoId = crypto.randomBytes(12).toString("hex");
  return `tran_${cryptoId}`;
};
```

### 5. Payment Controller Implementation

```typescript
// src/app/modules/payment/payment.controller.ts
import { Request, Response } from 'express';
import { SSLService } from '../sslCommerz/sslCommerz.service';
import Payment from './payment.model';
import Booking from '../booking/booking.model';
import { PAYMENT_STATUS } from './payment.interface';
import { BOOKING_STATUS } from '../booking/booking.interface';

const paymentSuccess = async (req: Request, res: Response) => {
  try {
    const { tran_id } = req.body;
    
    // Validate payment with SSLCommerz
    const validationResponse = await SSLService.validatePayment(tran_id);
    
    if (validationResponse.status === 'VALID') {
      // Update payment status
      const payment = await Payment.findOneAndUpdate(
        { transactionId: tran_id },
        { 
          status: PAYMENT_STATUS.PAID,
          gatewayData: validationResponse,
          paidAt: new Date()
        },
        { new: true }
      );

      if (payment) {
        // Update booking status
        await Booking.findByIdAndUpdate(payment.booking, {
          status: BOOKING_STATUS.CONFIRMED
        });
      }

      res.redirect(`${process.env.CLIENT_URL}/payment/success?transaction=${tran_id}`);
    } else {
      res.redirect(`${process.env.CLIENT_URL}/payment/failed?transaction=${tran_id}`);
    }
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/payment/failed`);
  }
};

const paymentFail = async (req: Request, res: Response) => {
  try {
    const { tran_id } = req.body;
    
    await Payment.findOneAndUpdate(
      { transactionId: tran_id },
      { status: PAYMENT_STATUS.FAILED }
    );

    res.redirect(`${process.env.CLIENT_URL}/payment/failed?transaction=${tran_id}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/payment/failed`);
  }
};

const paymentCancel = async (req: Request, res: Response) => {
  try {
    const { tran_id } = req.body;
    
    await Payment.findOneAndUpdate(
      { transactionId: tran_id },
      { status: PAYMENT_STATUS.CANCELLED }
    );

    res.redirect(`${process.env.CLIENT_URL}/payment/cancelled?transaction=${tran_id}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/payment/cancelled`);
  }
};

export const PaymentController = {
  paymentSuccess,
  paymentFail,
  paymentCancel,
};
```

## Payment Flow

### 1. Booking Creation Flow
1. User creates a booking
2. System validates user profile (phone, address required)
3. System calculates total amount based on tour cost and guest count
4. Creates booking record with PENDING status
5. Creates payment record with UNPAID status
6. Generates unique transaction ID
7. Initializes SSLCommerz payment
8. Returns booking details and payment URL

### 2. Payment Processing Flow
1. User is redirected to SSLCommerz gateway
2. User completes payment
3. SSLCommerz redirects to success/fail/cancel URL
4. System validates payment with SSLCommerz
5. Updates payment and booking status accordingly
6. Redirects user to appropriate frontend page

## Testing

### 1. Test Credentials (Sandbox)
```
Store ID: testbox
Store Password: qwerty
```

### 2. Test Card Numbers
```
Success: 4444444444444444
Fail: 5555555555555555
```

### 3. Testing Checklist
- [ ] Payment initialization
- [ ] Successful payment flow
- [ ] Failed payment handling
- [ ] Payment cancellation
- [ ] IPN (Instant Payment Notification) handling
- [ ] Transaction validation
- [ ] Database updates
- [ ] Error scenarios

## Error Handling

### Common Error Scenarios
1. **Invalid credentials**: Check store ID and password
2. **Network timeout**: Implement retry mechanism
3. **Invalid amount**: Validate amount format and minimum limits
4. **Missing required fields**: Validate all required parameters
5. **Transaction already exists**: Handle duplicate transaction IDs

### Error Response Format
```typescript
{
  success: false,
  message: "Error description",
  statusCode: 400,
  data: null
}
```

## Best Practices

### 1. Security
- Never expose SSLCommerz credentials in frontend
- Use HTTPS for all callback URLs
- Validate all incoming webhook data
- Implement rate limiting on payment endpoints

### 2. Database Transactions
- Use MongoDB transactions for payment operations
- Implement proper rollback mechanisms
- Log all payment activities

### 3. Monitoring
- Log all payment gateway interactions
- Monitor failed payment rates
- Set up alerts for payment failures

### 4. User Experience
- Provide clear payment status updates
- Handle network failures gracefully
- Implement loading states during payment processing

## Troubleshooting

### Common Issues

1. **Payment initialization fails**
   - Check store credentials
   - Verify callback URLs are accessible
   - Ensure amount is valid (minimum 10 BDT)

2. **Payment success but not updating database**
   - Check IPN URL configuration
   - Verify transaction validation logic
   - Review database transaction handling

3. **Webhook not receiving callbacks**
   - Ensure callback URLs are publicly accessible
   - Check firewall settings
   - Verify URL formats

### Debug Tips
- Enable detailed logging in development
- Use SSLCommerz sandbox for testing
- Monitor network requests/responses
- Check MongoDB transaction logs

## Production Deployment

### 1. Environment Setup
- Update SSLCommerz URLs to production endpoints
- Configure proper callback URLs
- Set up SSL certificates for callback endpoints

### 2. Security Checklist
- [ ] Environment variables secured
- [ ] Callback URLs use HTTPS
- [ ] Input validation implemented
- [ ] Error logging configured
- [ ] Rate limiting enabled

### 3. Monitoring
- Set up payment failure alerts
- Monitor transaction success rates
- Log all gateway interactions
- Implement health checks

