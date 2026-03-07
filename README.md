# UPS Shipping Integration Service

A TypeScript service that wraps the UPS Rating API to fetch
real-time shipping rates. Built as part of the Cybership
carrier integration assessment.

## What This Does

This service acts as a clean abstraction layer between your
application and the UPS Rating API. Instead of dealing with
UPS's complex raw API responses, you get simple normalized
rate quotes back.

Example:

- You send: origin, destination, package details
- You get back: clean list of shipping rates with prices

## Project Structure

```
src/
├── carriers/
│   └── ups/
│       ├── auth.ts        → UPS OAuth 2.0 token management
│       └── rates.ts       → UPS Rating API integration
├── interfaces/
│   ├── carrier.ts         → CarrierService contract
│   └── shipping.ts        → Domain models and types
├── config/
│   └── index.ts           → Environment configuration
└── index.ts               → Example usage entry point
tests/
├── auth.test.ts           → Authentication tests
└── rates.test.ts          → Rate shopping tests
```

## How To Run

### 1. Clone the repository

```bash
git clone https://github.com/YOURUSERNAME/ups-shipping-service
cd ups-shipping-service
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

### 4. Run the tests

```bash
npx jest
```

### 5. Run the example

```bash
npm start
```

## Architecture Decisions

### Why a CarrierService interface?

Every carrier (UPS, FedEx, DHL) implements the same
CarrierService interface. This means adding FedEx tomorrow
requires zero changes to existing UPS code. Just create a
new class that follows the same contract.

### Why token caching?

UPS OAuth tokens are valid for 1 hour. Instead of making
an auth request before every single rate request, we cache
the token and reuse it until it expires. This makes the
service faster and reduces unnecessary API calls.

### Why Zod for validation?

Runtime validation catches bad data before it ever reaches
the UPS API. This prevents confusing UPS error responses
and gives callers clear actionable errors instead.

## Running Tests

```bash
npx jest
```

Expected output:

- 8 tests passing across 2 test suites
- Auth lifecycle fully tested
- All error paths covered (401, 429, 500, timeout)
- No live API calls required

## What I Would Improve Given More Time

- Add Zod runtime validation on incoming RateRequest
- Add FedEx carrier implementation to demonstrate
  multi-carrier extensibility
- Add request timeout configuration via environment variables
- Add retry logic with exponential backoff for failed requests
- Add structured logging for production observability
- Add rate limiting protection on our own service layer

## Environment Variables

See .env.example for all required variables.

## Tech Stack

- TypeScript
- Node.js
- Axios — HTTP requests
- Dotenv — environment variables
- Jest + ts-jest — testing
