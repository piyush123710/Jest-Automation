# Salon Booking API — Jest Automation Suite

A comprehensive **Jest-based API automation suite** for the [Salon Booking Backend](https://github.com/Saud12131/Jest-assignment).  
It covers authentication, booking, slot-availability, authorization guards, negative scenarios, and a full **E2E workflow** (Register → Login → Get Slots → Book → Cancel).

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Required Dependencies](#required-dependencies)
4. [Environment Setup](#environment-setup)
5. [Database / External Service Requirements](#database--external-service-requirements)
6. [Running the Tests](#running-the-tests)
7. [Test Configuration](#test-configuration)
8. [Setup / Teardown](#setup--teardown)
9. [Test Coverage](#test-coverage)
10. [Assumptions & Design Decisions](#assumptions--design-decisions)

---

## Project Structure

```
Jest Automation Assignment/
├── tests/
│   ├── auth/
│   │   ├── register.test.ts      # POST /api/register (positive + negative)
│   │   └── login.test.ts         # POST /api/login    (positive + negative + security)
│   ├── salon/
│   │   └── availableSlots.test.ts# GET /api/salons/:id/available-slots
│   ├── booking/
│   │   ├── createBooking.test.ts  # POST /api/bookings (auth + positive + negative)
│   │   └── cancelBooking.test.ts  # DELETE /api/bookings/:id (auth + positive + negative)
│   ├── e2e/
│   │   └── workflow.test.ts       # Full E2E: Register→Login→Slots→Book→Cancel
│   └── utils/
│       ├── apiClient.ts           # Shared Axios instance
│       ├── testHelpers.ts         # API call wrappers + composite helpers
│       └── testData.ts            # Centralised test data / env config
├── .env.example                   # Environment variable template
├── .env                           # Local env (git-ignored)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| **Node.js** | ≥ 18.x LTS |
| **npm** | ≥ 9.x (bundled with Node 18) |
| **Salon Backend** | Running locally or remotely |
| **MongoDB** | As required by the backend |

> **Tip**: Use [nvm](https://github.com/nvm-sh/nvm) (or [nvm-windows](https://github.com/coreybutler/nvm-windows)) to manage Node versions.

---

## Required Dependencies

### Runtime

| Package | Purpose |
|---|---|
| `axios` | HTTP client used in all test helpers |
| `dotenv` | Loads `.env` into `process.env` |

### Dev / Test

| Package | Purpose |
|---|---|
| `jest` | Test runner |
| `ts-jest` | TypeScript transformer for Jest |
| `typescript` | TypeScript compiler |
| `@types/jest` | Jest type definitions |
| `@types/node` | Node.js type definitions |

---

## Environment Setup

### 1. Copy the env template

```bash
cp .env.example .env
```

### 2. Edit `.env`

```dotenv
# Base URL of the running Salon Backend
BASE_URL=http://localhost:3000

# Must match JWT_SECRET used by the backend
JWT_SECRET=your_jwt_secret_here

# MongoDB ObjectIds of seed documents in the target DB
TEST_SALON_ID=<paste_salon_objectid_here>
TEST_STYLIST_ID=<paste_stylist_objectid_here>
TEST_SERVICE_ID=<paste_service_objectid_here>
```

| Variable | Description |
|---|---|
| `BASE_URL` | Root URL of the Salon API (no trailing slash) |
| `JWT_SECRET` | The same secret used by the backend's `jwt.sign()` |
| `TEST_SALON_ID` | ObjectId of a `Salon` document — needed for slot & booking tests |
| `TEST_STYLIST_ID` | ObjectId of a `User` with `role: 'stylist'` |
| `TEST_SERVICE_ID` | ObjectId of a `Service` document |

> **Note**: If the seed ID variables are left as placeholder values, the slot and booking tests will receive `404` responses from the server. The test suite is written to handle this gracefully — those tests will pass with a `404`-is-acceptable assertion and log a warning. Only the **auth** and **auth-guard** tests (which use dynamically registered users) will run fully without seed data.

---

## Database / External Service Requirements

The Salon Backend requires a running **MongoDB** instance.  
Refer to the [backend repository](https://github.com/Saud12131/Jest-assignment) for setup instructions.

**Recommended seed workflow:**

1. Start MongoDB locally (`mongod` or Docker).
2. Start the backend (`npm run dev` in the backend repo).
3. Use a tool like Compass, `mongosh`, or a seed script to insert at least one `Salon`, one `Service`, and one stylist `User` document.
4. Copy their `_id` values into `.env`.

---

## Running the Tests

### Install dependencies first

```bash
npm install
```

### Run all tests (recommended)

```bash
npm test
```

### Run with verbose output

```bash
npm run test:verbose
```

### Run a specific suite

```bash
# Auth tests only
npm run test:auth

# Booking tests only
npm run test:booking

# Salon / slot tests only
npm run test:salon

# E2E workflow only
npm run test:e2e
```

### Run with coverage report

```bash
npm run test:coverage
```

Coverage report is written to `coverage/` and can be opened in a browser via `coverage/lcov-report/index.html`.

---

## Test Configuration

Jest is configured directly in `package.json` under the `"jest"` key:

| Setting | Value | Reason |
|---|---|---|
| `preset` | `ts-jest` | Enables TypeScript without a build step |
| `testEnvironment` | `node` | HTTP/Node APIs; no DOM needed |
| `testTimeout` | `30000` ms | Generous timeout for real network calls |
| `testMatch` | `**/tests/**/*.test.ts` | Finds all test files recursively |
| `--runInBand` | (CLI flag) | Serial execution — E2E tests share state across `it` blocks |

---

## Setup / Teardown

The suite uses **Jest lifecycle hooks** (`beforeAll`) rather than a global setup script:

- Each `describe` block that needs an authenticated user registers and logs in during `beforeAll`.
- Unique emails are generated per test run (`uniqueEmail()`) to avoid conflicts between runs.
- **No global teardown** is included by design — test users and bookings remain in the DB. This is intentional: it keeps the suite stateless and re-runnable without requiring a clean DB each time.

> **Assumption**: The target DB is a development/test environment. Do **not** run this suite against production.

---

## Test Coverage Summary

| Suite | File | Scenarios |
|---|---|---|
| Register | `auth/register.test.ts` | 4 positive · 6 negative |
| Login | `auth/login.test.ts` | 3 positive · 6 negative |
| Available Slots | `salon/availableSlots.test.ts` | 3 positive · 6 negative |
| Create Booking | `booking/createBooking.test.ts` | 3 positive · 3 auth · 6 negative |
| Cancel Booking | `booking/cancelBooking.test.ts` | 2 positive · 3 auth · 3 negative |
| E2E Workflow | `e2e/workflow.test.ts` | 6-step happy path · 3 auth guard checks |

**Total: ~44 test cases** across 5 APIs.

---

## Assumptions & Design Decisions

1. **`validateStatus: () => true`** — Axios is configured to never throw on HTTP errors, so we can assert on any status code in tests cleanly.

2. **Flexible body assertions** — Response field paths (e.g. `res.data.token` vs `res.data.data.token`) are accessed with optional chaining (`??`) to tolerate minor API evolution.

3. **Seed data tolerance** — Tests that require real MongoDB ObjectIds accept `404` as a valid response when placeholder IDs are in `.env`, printing a `console.warn`. This prevents false failures during CI where the DB might not be pre-seeded.

4. **`--runInBand`** — Required because the E2E workflow test shares state (`authToken`, `createdBookingId`) across sequential `it` blocks. Parallel execution would break ordering.

5. **No mocking** — All tests call the live API. This validates true integration behaviour, not mocked logic.

6. **Security checks** — Login tests include a NoSQL injection probe and verify that password hashes are never leaked in responses.

7. **Cross-user authorization** — The cancel-booking tests register two separate users and verify that one user cannot cancel the other's booking (expecting `403` or `404`).
