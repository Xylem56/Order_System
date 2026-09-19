# Design Notes

## Why staff accounts require a pre-issued staffId
This models how real logistics/courier companies onboard staff: employees
don't self-register. In production, a company would generate and hand staff
IDs to new hires directly (physical ID card, HR system, etc.). In this project,
that step is simulated with a seed script (`seedStaffIds.js`) that inserts a
batch of valid, unused staffIds directly into the database — standing in for
whatever internal admin process a real company would use.

## Why DynamoDB single-table design
Orders and their status history are always fetched together (one lookup by
trackingId should return everything). Rather than two separate tables joined
in application code, both record types live in one table, distinguished by
the `recordType` sort key. This is a standard DynamoDB pattern for
one-to-many relationships where the "many" side is always fetched with the "one".

## Local development
This project runs against LocalStack, a local AWS emulator, rather than a
real AWS account — no AWS billing/account required to run or test it.
LocalStack does not persist data by default, so tables must be recreated and
reseeded (`seedStaffIds.js`) after every LocalStack restart during development.