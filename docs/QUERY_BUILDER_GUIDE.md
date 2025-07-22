# QueryBuilder Pattern Implementation Guide

## Overview

The `QueryBuilder` class is a utility pattern implementation that provides a fluent interface for building complex MongoDB queries in a Node.js/Express application using Mongoose. This guide examines how it's implemented in the `getAllTours` function and analyzes its benefits and limitations.

## Table of Contents

1. [QueryBuilder Architecture](#querybuilder-architecture)
2. [Implementation Analysis](#implementation-analysis)
3. [Method Chain Execution Flow](#method-chain-execution-flow)
4. [Usage Patterns](#usage-patterns)
5. [Pros and Cons](#pros-and-cons)
6. [Best Practices](#best-practices)
7. [Alternative Approaches](#alternative-approaches)

## QueryBuilder Architecture

### Core Structure

```typescript
export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }
}
```

The QueryBuilder follows the **Builder Pattern** with these key characteristics:

- **Fluent Interface**: Methods return `this` allowing method chaining
- **Stateful**: Maintains the current query state in `modelQuery`
- **Generic**: Uses TypeScript generics for type safety
- **Immutable Query Object**: The original query parameters are readonly

### Core Methods

| Method       | Purpose                                        | Query Parameters Used                   |
| ------------ | ---------------------------------------------- | --------------------------------------- |
| `filter()`   | Applies field-based filtering                  | All query params except excluded fields |
| `search()`   | Implements text search across specified fields | `searchTerm`                            |
| `sort()`     | Applies sorting to results                     | `sort`                                  |
| `fields()`   | Selects specific fields to return              | `fields`                                |
| `paginate()` | Implements pagination                          | `page`, `limit`                         |
| `getMeta()`  | Returns pagination metadata                    | `page`, `limit`                         |
| `build()`    | Returns the final query for execution          | -                                       |

## Implementation Analysis

### 1. Filter Method

```typescript
filter(): this {
  const filter = { ...this.query };
  for (const field of excludeFields) {
    delete filter[field];
  }
  this.modelQuery = this.modelQuery.find(filter);
  return this;
}
```

**What it does:**

- Creates a copy of query parameters
- Removes reserved fields (`["searchTerm", "sort", "fields", "page", "limit"]`)
- Applies remaining parameters as MongoDB filters
- Supports exact matches on any tour field

**Example:**

```
GET /tours?division=507f1f77bcf86cd799439011&tourType=507f1f77bcf86cd799439012
```

Results in: `{ division: "507f1f77bcf86cd799439011", tourType: "507f1f77bcf86cd799439012" }`

### 2. Search Method

```typescript
search(searchableFields: string[]): this {
  const searchTerm = this.query.searchTerm || "";
  const searchQuery = {
    $or: searchableFields.map((field: string) => ({
      [field]: { $regex: searchTerm, $options: "i" }
    })),
  };
  this.modelQuery = this.modelQuery.find(searchQuery);
  return this;
}
```

**What it does:**

- Implements full-text search across predefined fields (`["title", "description", "location"]`)
- Uses MongoDB `$regex` with case-insensitive matching
- Creates an `$or` query to search multiple fields simultaneously

**Example:**

```
GET /tours?searchTerm=beach
```

Results in: `{ $or: [{ title: /beach/i }, { description: /beach/i }, { location: /beach/i }] }`

### 3. Sort Method

```typescript
sort(): this {
  const sort = this.query?.sort || "-createdAt";
  this.modelQuery = this.modelQuery.sort(sort);
  return this;
}
```

**What it does:**

- Applies sorting with default descending by creation date
- Supports MongoDB sort syntax (prefix `-` for descending)
- Allows multiple field sorting

**Examples:**

```
GET /tours?sort=title          // Ascending by title
GET /tours?sort=-startDate     // Descending by start date
GET /tours?sort=title,-costFrom // Multiple field sorting
```

### 4. Fields Method

```typescript
fields(): this {
  const fields = this.query.fields?.split(",").join(" ") || "";
  this.modelQuery = this.modelQuery.select(fields);
  return this;
}
```

**What it does:**

- Implements field projection to return only specified fields
- Converts comma-separated string to space-separated MongoDB format
- Reduces bandwidth and improves performance

**Example:**

```
GET /tours?fields=title,description,costFrom
```

Returns only these fields plus `_id` by default.

### 5. Paginate Method

```typescript
paginate(): this {
  const page = parseInt(this.query.page, 10) || 1;
  const limit = parseInt(this.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  this.modelQuery = this.modelQuery.skip(skip).limit(limit);
  return this;
}
```

**What it does:**

- Implements offset-based pagination
- Defaults: page=1, limit=10
- Calculates skip value automatically

**Example:**

```
GET /tours?page=3&limit=20
```

Skips 40 records and returns next 20.

### 6. GetMeta Method

```typescript
async getMeta() {
  const totalDocuments = await this.modelQuery.model.countDocuments();
  const page = parseInt(this.query.page, 10) || 1;
  const limit = parseInt(this.query.limit, 10) || 10;
  const totalPages = Math.ceil(totalDocuments / limit);

  return { page, limit, total: totalDocuments, totalPages };
}
```

**What it does:**

- Provides pagination metadata
- Counts total documents (⚠️ Performance concern)
- Calculates total pages

## Method Chain Execution Flow

### Optimal Order (as implemented)

```typescript
const tours = queryBuilder
  .filter() // 1. Apply field filters first (most selective)
  .search(tourSearchableFields) // 2. Add text search conditions
  .sort() // 3. Apply sorting
  .fields() // 4. Select specific fields
  .paginate(); // 5. Apply pagination (limit result set)
```

**Why this order matters:**

1. **Filter first**: Reduces dataset size early
2. **Search second**: Combines with filters using MongoDB's query optimization
3. **Sort third**: MongoDB can use indexes more effectively
4. **Fields fourth**: Projection happens after query execution planning
5. **Paginate last**: Limits the final result set

## Usage Patterns

### Pattern 1: Sequential Execution (Commented Out)

```typescript
const tours = await queryBuilder.filter().search(tourSearchableFields).sort().fields().paginate().build();
const meta = await queryBuilder.getMeta();
```

**Characteristics:**

- Simple and straightforward
- Two separate database operations
- Meta calculation happens after main query

### Pattern 2: Parallel Execution (Current Implementation)

```typescript
const tours = queryBuilder.filter().search(tourSearchableFields).sort().fields().paginate();

const [data, meta] = await Promise.all([tours.build(), queryBuilder.getMeta()]);
```

**Characteristics:**

- Executes data query and meta calculation in parallel
- Better performance due to concurrent execution
- Consistent pagination state between calls

## Pros and Cons

### ✅ Pros

#### 1. **Code Readability and Maintainability**

```typescript
// Clean, readable chain
queryBuilder.filter().search(fields).sort().fields().paginate();

// vs. verbose alternative
Tour.find(filter).find(searchQuery).sort(sortOptions).select(fieldOptions).skip(skip).limit(limit);
```

#### 2. **Reusability**

- Same QueryBuilder can be used across different models
- Consistent API across the application
- Easy to extend with new query methods

#### 3. **Type Safety**

```typescript
export class QueryBuilder<T> // Generic type ensures type safety
```

#### 4. **Separation of Concerns**

- Query logic separated from business logic
- Each method has a single responsibility
- Easy to test individual query components

#### 5. **Fluent Interface**

- Intuitive method chaining
- Self-documenting code
- IDE autocomplete support

#### 6. **Flexible Parameter Handling**

- Automatically handles missing parameters
- Provides sensible defaults
- Graceful degradation

### ❌ Cons

#### 1. **Performance Issues**

**Total Count Problem:**

```typescript
const totalDocuments = await this.modelQuery.model.countDocuments();
```

- `countDocuments()` scans entire collection
- Becomes slow with large datasets
- No filtering applied to count query

**Multiple Query Execution:**

- Data query and count query are separate operations
- No shared query optimization

#### 2. **Memory and Complexity**

- Maintains query state throughout the chain
- Each method creates new query conditions
- Potential memory overhead with complex queries

#### 3. **Limited Error Handling**

```typescript
const page = parseInt(this.query.page, 10) || 1; // Silent failure on invalid input
```

- No validation of query parameters
- Silent failures with invalid data types
- No error context for debugging

#### 4. **Inflexibility with Complex Queries**

- Hard to implement conditional logic
- Difficult to handle nested queries
- Limited support for aggregation pipelines

#### 5. **Debugging Challenges**

- Query construction is hidden in method chain
- Hard to inspect intermediate query states
- No logging of query performance

#### 6. **Pagination Limitations**

- Offset-based pagination (skip/limit) doesn't scale well
- No cursor-based pagination support
- Page drift issues with concurrent modifications

## Best Practices

### 1. **Query Optimization**

```typescript
// Add indexes for filtered and sorted fields
// In tour.model.ts
tourSchema.index({ division: 1, tourType: 1 }); // Compound index for filters
tourSchema.index({ title: "text", description: "text", location: "text" }); // Text index for search
tourSchema.index({ createdAt: -1 }); // Index for default sort
```

### 2. **Error Handling Enhancement**

```typescript
// Improved parameter validation
paginate(): this {
  const page = Math.max(1, parseInt(this.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(this.query.limit, 10) || 10));

  if (isNaN(page) || isNaN(limit)) {
    throw new Error('Invalid pagination parameters');
  }

  const skip = (page - 1) * limit;
  this.modelQuery = this.modelQuery.skip(skip).limit(limit);
  return this;
}
```

### 3. **Performance Monitoring**

```typescript
// Add query performance logging
build(): Query<T[], T> {
  console.time('QueryBuilder');
  const query = this.modelQuery;
  console.timeEnd('QueryBuilder');
  return query;
}
```

### 4. **Cached Count for Better Performance**

```typescript
// Consider caching total counts or using approximations
async getMeta() {
  // For large datasets, consider using estimatedDocumentCount()
  // or implementing cache-based counting
  const totalDocuments = await this.modelQuery.model.estimatedDocumentCount();
  // ... rest of implementation
}
```

## Alternative Approaches

### 1. **Aggregation Pipeline Approach**

```typescript
const pipeline = [
  { $match: filter },
  { $match: searchQuery },
  { $sort: sortOptions },
  {
    $facet: {
      data: [{ $skip: skip }, { $limit: limit }, { $project: fieldProjection }],
      count: [{ $count: "total" }],
    },
  },
];

const [result] = await Tour.aggregate(pipeline);
```

**Benefits:**

- Single database operation
- Better performance for complex queries
- More flexible for complex transformations

### 2. **Repository Pattern**

```typescript
class TourRepository {
  async findWithFilters(options: QueryOptions) {
    // Encapsulate all query logic in repository
  }
}
```

**Benefits:**

- Better separation of concerns
- Easier to mock for testing
- More explicit about data access patterns

### 3. **Query Object Pattern**

```typescript
class TourQuery {
  private conditions: any[] = [];

  addFilter(filter: object) {
    this.conditions.push(filter);
    return this;
  }

  execute() {
    return Tour.find({ $and: this.conditions });
  }
}
```

**Benefits:**

- More explicit about query conditions
- Easier to debug and inspect
- Better for complex conditional logic

## Conclusion

The QueryBuilder pattern provides a clean, reusable solution for handling common query operations. While it excels in readability and maintainability, it has performance limitations that become apparent with large datasets. For optimal performance, consider:

1. **Implementing proper indexing strategies**
2. **Using aggregation pipelines for complex queries**
3. **Caching expensive operations like total counts**
4. **Adding proper error handling and validation**
5. **Monitoring query performance in production**

The pattern works well for small to medium-sized applications but may require optimization or alternative approaches for high-performance scenarios.
