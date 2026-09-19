# Database Structure

This project uses DynamoDB (via AWS SDK, run locally through LocalStack for development).
Three tables are used no relational joins, since DynamoDB doesn't support them.

## Orders table
- Partition key: `trackingId` (string)
- Sort key: `recordType` (string)

Uses single-table design: one `trackingId` groups together an order's core info
and its full status history as separate items in the same table.

**ORDER item** (recordType = "ORDER")
```json
{
  "trackingId": "uuid",
  "recordType": "ORDER",
  "item": "string",
  "origin": "string",
  "destination": "string",
  "status": "PENDING | CONFIRMED | PICKED_UP | IN_TRANSIT | AT_DESTINATION | OUT_FOR_DELIVERY | DELIVERED | CANCELLED",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

**STATUS item** (recordType = "STATUS#<ISO timestamp>")
```json
{
  "trackingId": "uuid",
  "recordType": "STATUS#2026-09-19T08:43:19.183Z",
  "status": "string",
  "location": "string",
  "notes": "string (optional)",
  "timestamp": "ISO timestamp"
}
```

Querying by `trackingId` alone returns all items for that order, already sorted:
`"ORDER"` sorts before `"STATUS#..."` alphabetically, and ISO timestamps sort
chronologically as plain strings — so history comes back oldest to newest with
no extra sorting logic needed.

## Staff table
- Partition key: `email` (string)

Stores staff login accounts (hashed password, role). Looked up by email at login.

## StaffIds table
- Partition key: `staffId` (string)

Pre-seeded pool of valid staff IDs, each with a `used` boolean. Registration
checks a submitted `staffId` against this table before creating an account,
then flips `used` to `true`.