# Backend Integration Status

The previously recorded blockers were verified against the backend source and
resolved on 2026-09-08.

## Driver dashboard claim and route

Resolved in `DriverDashboardController`:

- Driver identity is read from `ClaimTypes.NameIdentifier`.
- `/api/driver-dashboard` is the canonical route.
- `/api/driver-hashboard` remains as a compatibility alias.
- Driver endpoints require the `DriverOnly` authorization policy.
- Monthly and yearly statistics return structured count objects.

## JSON Patch input

Resolved in backend startup configuration:

- MVC uses `AddNewtonsoftJson()` with `StringEnumConverter`.
- RFC 6902 requests using `application/json-patch+json` can be bound by the
  route-price and user-profile patch actions.

The backend still requires a configured SQL Server connection and JWT settings
to run locally. These are deployment/environment prerequisites rather than
frontend blockers.
