## getAllTours Patterns Explained

### First Pattern

```ts
const tours = await Tour.find(searchQuery)
                        .find(filter)
                        .sort(sort)
                        .select(fields)
                        .skip(skip)
                        .limit(limit);
```

**Explanation:**
- `Tour.find(searchQuery)` returns a Mongoose Query object.
- `.find(filter)` continues chaining another filter query.
- Mongoose merges both `searchQuery` and `filter` into a single MongoDB query.

**Pros:**
- Clean and compact.
- Easier to write and understand for small to medium complexity.

**Cons:**
- Less explicit control over query composition.

---

### Second Pattern

```ts
const filterQuery = Tour.find(filter);
const toursWithSearchQuery = filterQuery.find(searchQuery);
const tours = await toursWithSearchQuery.sort(sort)
                                        .select(fields)
                                        .skip(skip)
                                        .limit(limit);
```

**Explanation:**
- Breaks down the query into multiple steps.
- Allows inspection or modification between stages.
- Useful when you want to debug or conditionally apply queries.

**Pros:**
- More explicit and flexible.
- Easier to insert logs, conditional logic, or transformations.

**Cons:**
- Slightly more verbose.
- Overhead of intermediate variables might be unnecessary for simple cases.

---

### Which One to Use?

**Use First Pattern When:**
- You have simple or straightforward query logic.
- Readability and compactness are priorities.

**Use Second Pattern When:**
- The query is dynamic or has complex conditions.
- You want to debug or inject conditional steps in the middle.
- You need more control over how parts of the query are applied.

**Performance:**
- Both patterns compile to the same MongoDB query internally.
- No significant performance difference in most cases.
