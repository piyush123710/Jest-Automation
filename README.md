# Salon Booking API — Jest Automation Suite

A comprehensive **Jest-based API automation suite** for the [Salon Booking Backend](https://github.com/Saud12131/Jest-assignment).  
It covers authentication, booking, slot-availability, authorization guards, negative scenarios, and a full **E2E workflow** (Register → Login → Get Slots → Book → Cancel).

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Required Dependencies](#required-dependencies)
4. [Execution Modes (Mock vs Live API)](#execution-modes-mock-vs-live-api)
5. [Environment Setup](#environment-setup)
6. [Database / External Service Requirements](#database--external-service-requirements)
7. [Running the Tests](#running-the-tests)
8. [Test Configuration](#test-configuration)
9. [Setup / Teardown](#setup--teardown)
10. [Test Coverage Summary](#test-coverage-summary)
11. [Assumptions & Design Decisions](#assumptions--design-decisions)

---

## Project Structure

```
Jest Automation Assignment/
├── .github/
│   └── workflows/
│       └── test.yml               # GitHub Actions CI Workflow
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
│       ├── apiClient.ts           # Axios instance with mock fallback
│       ├── mockServer.ts          # In-memory API simulation engine
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
| **Salon Backend** | (Optional if running in Mock mode, required for live testing) |
| **MongoDB** | As required by the live backend |

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

## Execution Modes (Mock vs Live API)

The suite supports two execution modes via `USE_MOCK` in `.env`:

1. **Mock Mode (`USE_MOCK=true`, Default):**
   - Runs against the high-fidelity in-memory mock engine (`tests/utils/mockServer.ts`).
   - Self-contained, zero-dependency, zero network latency, and runs 100% reliably in CI/CD (GitHub Actions).
   - Simulates complete backend business logic, validation rules, token generation, conflict handling, and error codes.

2. **Live Backend Mode (`USE_MOCK=false`):**
   - Dispatches real HTTP requests over the network to `BASE_URL` (e.g., `http://localhost:3000`).
   - Requires running MongoDB and backend server.

---

## Environment Setup

### 1. Copy the env template

```bash
cp .env.example .env
```

### 2. Edit `.env`

```dotenv
# Execution mode: true for standalone/mock, false for live backend
USE_MOCK=true

# Base URL of the running Salon Backend (when USE_MOCK=false)
BASE_URL=http://localhost:3000

# Must match JWT_SECRET used by the backend
JWT_SECRET=your_jwt_secret_here

# MongoDB ObjectIds of seed documents in the target DB
TEST_SALON_ID=000000000000000000000001
TEST_STYLIST_ID=000000000000000000000002
TEST_SERVICE_ID=000000000000000000000003
```

---

## Database / External Service Requirements

When running in **Live Backend Mode** (`USE_MOCK=false`):
- A running **MongoDB** instance is required.
- Start the backend (`npm run dev` in the backend repository).
- Ensure test IDs in `.env` exist in MongoDB.

---

## Running the Tests

### Install dependencies first

```bash
npm install
```

### Run all tests

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

---

## Test Configuration

Jest is configured directly in `package.json`:

| Setting | Value | Reason |
|---|---|---|
| `preset` | `ts-jest` | Enables TypeScript without a build step |
| `testEnvironment` | `node` | Node.js environment |
| `testTimeout` | `30000` ms | Generous timeout for network calls |
| `testMatch` | `**/tests/**/*.test.ts` | Finds all test files |
| `--runInBand` | (CLI flag) | Enforces deterministic serial execution |

---

## Setup / Teardown

The suite uses **Jest lifecycle hooks** (`beforeAll`) for local setup:

- Each `describe` block requiring an authenticated user registers and authenticates dynamically.
- `uniqueEmail()` generates timestamped emails per run to avoid collision.
- No hard cleanup is required between test runs.

---

## Test Coverage Summary

| Suite | File | Tests | Scenarios Tested |
|---|---|---|---|
| **Register** | `tests/auth/register.test.ts` | 10 | 201 creation, token generation, user details, duplicate email 400, missing fields 400, malformed email |
| **Login** | `tests/auth/login.test.ts` | 9 | 200 token return, JWT 3-part format, password security (hash not leaked), wrong password 4xx, unregistered email 4xx, missing fields 400, NoSQL injection guard |
| **Available Slots** | `tests/salon/availableSlots.test.ts` | 9 | 200 slots array, past date handling, slot structure validation, missing query params 400, non-existent salon 404, non-existent service 404, malformed ID 400 |
| **Create Booking** | `tests/booking/createBooking.test.ts` | 12 | 201 booking creation, status verification, time intervals, 401 unauthenticated, 401 invalid token, 401 expired token, missing date 400, missing service 400, non-existent service 404, missing salon 400, missing slot 400 |
| **Cancel Booking** | `tests/booking/cancelBooking.test.ts` | 8 | 200 cancellation, status change to cancelled, 401 unauthenticated, 401 invalid token, 403 cross-user authorization protection, 404 non-existent booking, 400 double cancellation, malformed ID 400 |
| **E2E Workflow** | `tests/e2e/workflow.test.ts` | 9 | Full end-to-end chain: Register → Login → Get Slots → Book → Cancel → Prevent Re-cancel, plus full auth-guard suite |

**Total: 57 Passed Tests Across 6 Test Suites**

---

## Assumptions & Design Decisions

1. **`validateStatus: () => true`**: Axios does not throw on HTTP status errors, enabling straightforward assertions on error responses.
2. **Dual-Mode Adapter Architecture**: Tests run out-of-the-box in standalone mock mode or against live backend APIs via simple `.env` toggle (`USE_MOCK`).
3. **Deterministic Serial Execution (`--runInBand`)**: Guarantees test order in E2E flows where steps depend on state from preceding steps.
4. **Cross-User Authorization Testing**: Verifies that User B cannot cancel a booking owned by User A (expecting `403 Forbidden`).
5. **NoSQL Injection Resistance**: Tests pass objects to email fields to verify backend handles non-string payloads safely.
