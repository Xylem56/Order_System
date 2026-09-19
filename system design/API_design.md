# API Design

## Auth

| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | /auth/register | None (requires a valid, unused staffId) | `{ full_name, email, password, staffId }` |
| POST | /auth/login | None | `{ email, password }`  returns `{ token }` |

No public self-signup  `/register` is gated by possession of a staffId that
only the company distributes (see Notes.md).

## Orders { staff only (JWT required) }

| Method | Endpoint | Body |
|---|---|---|
| POST | /orders | `{ item, origin, destination }` |
| POST | /orders/:trackingId/status | `{ status, location, notes? }` |

Both require `Authorization: Bearer <token>`.

## Orders { public }

| Method | Endpoint | Auth |
|---|---|---|
| GET | /orders/:trackingId | None |

Returns the order's info plus its full status history, sorted oldest to newest.
No token required — this mirrors real package-tracking pages (e.g. entering a
tracking number on a courier's public site).
