# Stafferoo, build spec for agents

## Non negotiables
- Next.js app router
- TypeScript strict
- Zod validation for all inputs
- Robust error handling
- Feature flags by default for risky features
- Observability first, structured logs plus audit events
- Postgres with migrations
- Background tasks via jobs table and Node worker process
- Email sending uses Resend for invoices

## Roles and naming
- Call workers, staff
- Organisations are settings
- Admin is platform operator

## Current gates
Always run this after every change:
- npm run gate

Gate definition:
- npm run lint
- npm run build
- npm run test

## Development workflow
- Small slices only
- Do not mark done until gates pass
- Prefer whole file replacements
- Avoid adding new dependencies unless required

## Current product rules
- Settings can sign up but are not live until their postcode is enabled by admin
- Admin dashboard flags density of staff and settings by postcode
- Staff onboarding includes DBS update service number and consent
- Verification runs via background worker, stores valid, invalid, or manual review

## Pricing
- Standard, 249 per setting per month
- Multi site, 249 plus 99 per additional location
- Enterprise, uplift with advanced governance, approvals, audit, reporting, integrations, priority support
- Usage charge, 23 per hour for settings

## Definition of Done
- Code merged to main
- Gates pass
- Validation and error handling added
- Migrations reversible
- Audit log events for sensitive actions
