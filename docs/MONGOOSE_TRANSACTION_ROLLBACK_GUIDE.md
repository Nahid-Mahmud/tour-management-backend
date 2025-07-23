# Mongoose Transaction Rollback Guide

## Table of Contents

- [Overview](#overview)
- [When to Use Transactions](#when-to-use-transactions)
- [Basic Transaction Pattern](#basic-transaction-pattern)
- [Transaction Lifecycle](#transaction-lifecycle)
- [Error Handling and Rollback](#error-handling-and-rollback)
- [Best Practices](#best-practices)
- [Common Pitfalls](#common-pitfalls)
- [Advanced Patterns](#advanced-patterns)
- [Real-World Examples](#real-world-examples)
- [Testing Transactions](#testing-transactions)

## Overview

MongoDB transactions provide ACID (Atomicity, Consistency, Isolation, Durability) properties for multi-document operations. In Mongoose, transactions ensure that either all operations succeed or all operations are rolled back, maintaining data consistency.

### Key Benefits

- **Atomicity**: All operations within a transaction succeed or fail together
- **Consistency**: Database remains in a valid state
- **Isolation**: Concurrent transactions don't interfere with each other
- **Durability**: Committed changes persist even after system failures

## When to Use Transactions

Use transactions when you need to:

- Perform multiple related database operations that must all succeed or fail together
- Maintain data consistency across multiple collections
- Handle complex business logic that involves multiple documents
- Ensure referential integrity in NoSQL environments

### Examples of Transaction Use Cases

- Creating a booking with associated payment records
- User registration with profile creation
- Order processing with inventory updates
- Financial transfers between accounts

## Basic Transaction Pattern

```typescript
import { startSession } from "mongoose";

const performTransaction = async () => {
  const session = await startSession();

  session.startTransaction();
  try {
    // Perform your database operations here
    const result1 = await Model1.create([data1], { session });
    const result2 = await Model2.findByIdAndUpdate(id, data2, { session });

    // Commit the transaction
    await session.commitTransaction();

    return { result1, result2 };
  } catch (error) {
    // Rollback the transaction
    await session.abortTransaction();
    throw error;
  } finally {
    // Always end the session
    session.endSession();
  }
};
```

## Transaction Lifecycle

### 1. Session Creation

```typescript
const session = await Model.startSession();
// or
const session = await startSession();
```

### 2. Transaction Start

```typescript
session.startTransaction();
```

### 3. Database Operations

```typescript
// All operations must include the session
await Model.create([data], { session });
await Model.findByIdAndUpdate(id, data, { session });
await Model.deleteOne({ _id: id }, { session });
```

### 4. Transaction Commit

```typescript
await session.commitTransaction();
```

### 5. Session Cleanup

```typescript
session.endSession();
```

## Error Handling and Rollback

### Automatic Rollback

When an error occurs within a transaction, you must explicitly call `session.abortTransaction()` to rollback all changes:

```typescript
const createBookingWithPayment = async (bookingData, paymentData) => {
  const session = await Booking.startSession();

  session.startTransaction();
  try {
    // Validate business rules
    if (!bookingData.guestCount || bookingData.guestCount <= 0) {
      throw new Error("Invalid guest count");
    }

    // Create booking
    const booking = await Booking.create([bookingData], { session });

    // Create associated payment
    const payment = await Payment.create(
      [
        {
          ...paymentData,
          booking: booking[0]._id,
        },
      ],
      { session }
    );

    // Update booking with payment reference
    const updatedBooking = await Booking.findByIdAndUpdate(
      booking[0]._id,
      { payment: payment[0]._id },
      { new: true, session }
    );

    await session.commitTransaction();
    return updatedBooking;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

### Error Types and Handling

#### 1. Validation Errors

```typescript
try {
  // operations
} catch (error) {
  await session.abortTransaction();

  if (error.name === "ValidationError") {
    throw new AppError(400, "Validation failed");
  }
  throw error;
}
```

#### 2. Duplicate Key Errors

```typescript
try {
  // operations
} catch (error) {
  await session.abortTransaction();

  if (error.code === 11000) {
    throw new AppError(409, "Duplicate entry");
  }
  throw error;
}
```

#### 3. Transaction Conflicts

```typescript
try {
  // operations
} catch (error) {
  await session.abortTransaction();

  if (error.hasErrorLabel("TransientTransactionError")) {
    // Retry the transaction
    return retryTransaction();
  }
  throw error;
}
```

## Best Practices

### 1. Always Use Try-Catch-Finally

```typescript
const session = await startSession();
session.startTransaction();

try {
  // operations
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 2. Keep Transactions Short

```typescript
// ❌ Bad: Long-running operations
const badTransaction = async () => {
  const session = await startSession();
  session.startTransaction();

  try {
    await heavyComputation(); // Avoid this
    await externalAPICall(); // Avoid this
    await Model.create([data], { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ✅ Good: Only database operations
const goodTransaction = async (precomputedData) => {
  const session = await startSession();
  session.startTransaction();

  try {
    await Model.create([precomputedData], { session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

### 3. Use Session Consistently

```typescript
// ❌ Bad: Missing session in some operations
const inconsistentSession = async () => {
  const session = await startSession();
  session.startTransaction();

  try {
    await Model1.create([data1], { session }); // ✅ Has session
    await Model2.create([data2]); // ❌ Missing session

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

### 4. Validate Before Transaction

```typescript
const validateAndExecute = async (data) => {
  // ✅ Good: Validate before starting transaction
  if (!data.requiredField) {
    throw new Error("Required field missing");
  }

  const session = await startSession();
  session.startTransaction();

  try {
    // Now perform database operations
    await Model.create([data], { session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

## Common Pitfalls

### 1. Forgetting to End Session

```typescript
// ❌ Bad: Session not ended
const badExample = async () => {
  const session = await startSession();
  try {
    // operations
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
  // Missing: session.endSession()
};
```

### 2. Not Aborting on Error

```typescript
// ❌ Bad: No abort on error
const badErrorHandling = async () => {
  const session = await startSession();
  session.startTransaction();

  try {
    // operations
    await session.commitTransaction();
  } catch (error) {
    // Missing: await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

### 3. Using Transactions for Single Operations

```typescript
// ❌ Bad: Unnecessary transaction for single operation
const unnecessaryTransaction = async () => {
  const session = await startSession();
  session.startTransaction();

  try {
    const result = await Model.create([data], { session });
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ✅ Good: Direct operation
const directOperation = async () => {
  return await Model.create(data);
};
```

## Advanced Patterns

### 1. Retry Logic for Transient Errors

```typescript
const retryableTransaction = async (operation, maxRetries = 3) => {
  let attempts = 0;

  while (attempts < maxRetries) {
    const session = await startSession();
    session.startTransaction();

    try {
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();

      if (error.hasErrorLabel("TransientTransactionError") && attempts < maxRetries - 1) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 100 * attempts));
        continue;
      }

      throw error;
    } finally {
      session.endSession();
    }
  }
};
```

### 2. Transaction Wrapper Function

```typescript
const withTransaction = async <T>(operation: (session: ClientSession) => Promise<T>): Promise<T> => {
  const session = await startSession();
  session.startTransaction();

  try {
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Usage
const createBooking = async (data) => {
  return withTransaction(async (session) => {
    const booking = await Booking.create([data], { session });
    const payment = await Payment.create([paymentData], { session });
    return { booking, payment };
  });
};
```

### 3. Nested Transactions (Not Supported)

```typescript
// ❌ MongoDB doesn't support nested transactions
const nestedTransactions = async () => {
  const session1 = await startSession();
  session1.startTransaction();

  try {
    // This won't work as expected
    const session2 = await startSession();
    session2.startTransaction();

    // operations...

    await session2.commitTransaction();
    session2.endSession();

    await session1.commitTransaction();
  } catch (error) {
    await session1.abortTransaction();
    throw error;
  } finally {
    session1.endSession();
  }
};
```

## Real-World Examples

### Example 1: Booking System (From Your Codebase)

```typescript
const createBooking = async (payload: Partial<IBooking>, userId: string) => {
  const session = await Booking.startSession();

  // Validate payload before starting transaction
  if (!payload.guestCount || payload.guestCount <= 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Guest count must be a positive integer");
  }

  const transactionId = getTransactionId();
  session.startTransaction();

  try {
    // Validate user profile
    const user = await User.findById(userId);
    if (!user?.phone || !user?.address) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Please update your profile with phone and address");
    }

    // Validate tour availability
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

    // Create associated payment
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
      { new: true, runValidators: true, session }
    )
      .populate("user", "name email phone address")
      .populate("tour", "title constFrom")
      .populate("payment");

    await session.commitTransaction();
    return updatedBooking;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

### Example 2: User Registration with Profile

```typescript
const registerUserWithProfile = async (userData, profileData) => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    // Create user
    const user = await User.create([userData], { session });

    // Create user profile
    const profile = await Profile.create(
      [
        {
          ...profileData,
          user: user[0]._id,
        },
      ],
      { session }
    );

    // Update user with profile reference
    await User.findByIdAndUpdate(user[0]._id, { profile: profile[0]._id }, { session });

    await session.commitTransaction();
    return { user: user[0], profile: profile[0] };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

### Example 3: Inventory Management

```typescript
const processOrder = async (orderData, items) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    // Create order
    const order = await Order.create([orderData], { session });

    // Update inventory for each item
    for (const item of items) {
      const product = await Product.findById(item.productId, null, { session });

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } }, { session });
    }

    await session.commitTransaction();
    return order[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

## Testing Transactions

### Unit Testing with Mocked Sessions

```typescript
import { jest } from "@jest/globals";

describe("Transaction Tests", () => {
  let mockSession;

  beforeEach(() => {
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    jest.spyOn(Model, "startSession").mockResolvedValue(mockSession);
  });

  it("should commit transaction on success", async () => {
    await createBooking(validData, userId);

    expect(mockSession.startTransaction).toHaveBeenCalled();
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it("should abort transaction on error", async () => {
    jest.spyOn(Booking, "create").mockRejectedValue(new Error("Database error"));

    await expect(createBooking(invalidData, userId)).rejects.toThrow();

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
describe("Transaction Integration Tests", () => {
  it("should rollback on booking creation failure", async () => {
    const initialBookingCount = await Booking.countDocuments();
    const initialPaymentCount = await Payment.countDocuments();

    // Force an error by providing invalid data
    try {
      await createBooking(invalidBookingData, userId);
    } catch (error) {
      // Expected to fail
    }

    // Verify no documents were created
    const finalBookingCount = await Booking.countDocuments();
    const finalPaymentCount = await Payment.countDocuments();

    expect(finalBookingCount).toBe(initialBookingCount);
    expect(finalPaymentCount).toBe(initialPaymentCount);
  });
});
```

## Performance Considerations

1. **Keep transactions short**: Long-running transactions can block other operations
2. **Minimize cross-collection operations**: Each additional collection increases complexity
3. **Use indexes effectively**: Ensure all queried fields are indexed
4. **Monitor transaction metrics**: Track commit/abort ratios and duration

## Troubleshooting

### Common Error Messages

#### "Cannot start transaction on session with transaction in progress"

```typescript
// ❌ Starting transaction twice
session.startTransaction();
session.startTransaction(); // This will fail

// ✅ Check transaction state
if (!session.inTransaction()) {
  session.startTransaction();
}
```

#### "Cannot commit transaction that is not in progress"

```typescript
// ❌ Committing without starting
await session.commitTransaction(); // This will fail

// ✅ Proper sequence
session.startTransaction();
// operations...
await session.commitTransaction();
```

### Debugging Tips

1. **Log transaction states**: Add logging to track transaction lifecycle
2. **Use MongoDB Compass**: Monitor active transactions
3. **Check MongoDB logs**: Look for transaction-related errors
4. **Implement health checks**: Monitor transaction success rates

## Conclusion

Mongoose transactions are powerful tools for maintaining data consistency in complex operations. Remember these key points:

- Always use try-catch-finally pattern
- Abort transactions on errors
- End sessions in finally blocks
- Keep transactions short and focused
- Validate data before starting transactions
- Use sessions consistently across all operations

By following these patterns and best practices, you can build robust applications that maintain data integrity even in the face of errors and concurrent operations.
