# API Testing Guide

This project uses **Jest**, **Supertest**, and **MongoDB Memory Server** for automated API testing.

## Prerequisites

Ensure you have installed the dependencies:
```bash
npm install
```

## Running Tests

To run the full test suite:
```bash
npm test
```

To run a specific test file:
```bash
npm test tests/bookRoutes.test.js
```

## Test Structure

- **`tests/setup.js`**: Global configuration.
  - Starts an in-memory MongoDB instance before all tests.
  - Connects Mongoose to this in-memory instance.
  - Clears the database between each test to ensure isolation.
  - Sets environment variables (e.g., `ADMIN_SECRET`, `NODE_ENV`).

- **`tests/*.test.js`**: Test files for specific routes.
  - `bookRoutes.test.js`: Tests public book endpoints (Create, Get, Search, Delete).
  - `adminRoutes.test.js`: Tests admin endpoints (Pending, Approve, Reject).
  - `healthRoutes.test.js`: Tests the health check endpoint.

- **`tests/utils/`**: Helper utilities (if any).

## Database Isolation

We use `mongodb-memory-server` to spin up a temporary, empty database in RAM for every test run.
- **No Real Data**: The production/development database is NEVER touched.
- **Speed**: In-memory operations are extremely fast.
- **Consistency**: The database is wiped clean before each test (`beforeEach` hook in `setup.js`), ensuring no data leaks between tests.

## Extending Coverage

To add new tests:
1. Create a new file in `tests/` (e.g., `userRoutes.test.js`).
2. Import `supertest`, `app`, and relevant `models`.
3. Use `describe` blocks to group tests by route or feature.
4. Use `it` blocks for specific test cases.
5. Mock external services (like Cloudinary/Multer) using `jest.mock` if necessary to avoid external API calls.

Example:
```javascript
describe('New Feature', () => {
  it('should behave correctly', async () => {
    const res = await request(app).get('/api/new-feature');
    expect(res.statusCode).toBe(200);
  });
});
```
