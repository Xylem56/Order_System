
# Order Tracking API

A backend service for tracking shipments through their delivery lifecycle. It models the internal system a courier company would run — staff create shipment records and log status updates as a package moves, while tracking lookups are publicly accessible with no authentication, consistent with how real courier tracking pages work.

This is not an e-commerce order system. There is no checkout flow, product catalog, or customer-facing order creation the scope is limited to shipment tracking.

## Design decisions

Staff accounts are not self-registered. Registration requires a valid, unused `staffId`, simulating how a company would issue employee credentials internally rather than through open signup. A seed script provisions a batch of valid IDs for this purpose.

Tracking lookups (`GET /orders/:trackingId`) require no authentication by design, matching the public tracking experience of real courier services.

Full data modeling and API design rationale are documented in `system design/`.

## Stack

- Node.js / Express
- DynamoDB (AWS SDK v3), run locally via LocalStack
- JWT-based authentication, bcrypt password hashing
- Docker Compose (application and LocalStack run together — no separate LocalStack installation required)

## Setup

```
docker compose up --build
```

This starts the API on `localhost:3000` and LocalStack on `localhost:4566`. LocalStack does not persist data between restarts, so the required tables must be created and seeded after each fresh start:

```
aws --profile localstack --endpoint-url=http://localhost:4566 dynamodb create-table --table-name Orders --attribute-definitions AttributeName=trackingId,AttributeType=S AttributeName=recordType,AttributeType=S --key-schema AttributeName=trackingId,KeyType=HASH AttributeName=recordType,KeyType=RANGE --billing-mode PAY_PER_REQUEST

aws --profile localstack --endpoint-url=http://localhost:4566 dynamodb create-table --table-name Staff --attribute-definitions AttributeName=email,AttributeType=S --key-schema AttributeName=email,KeyType=HASH --billing-mode PAY_PER_REQUEST

aws --profile localstack --endpoint-url=http://localhost:4566 dynamodb create-table --table-name StaffIds --attribute-definitions AttributeName=staffId,AttributeType=S --key-schema AttributeName=staffId,KeyType=HASH --billing-mode PAY_PER_REQUEST

node src/scripts/seedStaffIds.js
```

## API Reference

### Auth

| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/auth/register` | Requires valid, unused `staffId` | `full_name`, `email`, `password`, `staffId` |
| POST | `/auth/login` | None | `email`, `password` → returns JWT |

### Orders (staff-only)

Requires `Authorization: Bearer <token>`.

| Method | Endpoint | Body |
|---|---|---|
| POST | `/orders` | `item`, `origin`, `destination` |
| POST | `/orders/:trackingId/status` | `status`, `location`, `notes` (optional) |

### Public

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/orders/:trackingId` | None |

Returns the order record along with its full status history, ordered chronologically.


## Notes

This project is built and tested against LocalStack rather than a live AWS account, so it can be run and reviewed without any AWS setup or cost.