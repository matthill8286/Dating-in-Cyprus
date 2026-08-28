# Runbook: cyprus-dating

Operational notes for the v1 API and Expo clients. Rollback detail lives in specs/cyprus-dating/release.json.

## On-call first checks

1. Container Apps revision health and 5xx rate.
2. Postgres CPU, connections, storage, and backup age (EU region only).
3. Discovery p95 and Photo verification p95.
4. Confirm no data store or processor is outside the EU.

## Resident gate failures

If join succeeds for people who are not Residents, turn off public join (scale Container Apps to zero or block the join route) and inspect the presence and number checks. Do not open the Pool to Visitors as a workaround.

## Photo verification vendor down

Turn `photo-verification-enabled` off. Unverified Profiles stay in the Pool and stay marked. Chat and discovery keep working.

## Push vendor down

Turn `push-enabled` off. Match and chat still work in the foreground.

## Account deletion stuck

If the deletion job is older than 7 days, inspect failed rows, replay the purge, and confirm Profile, photos, Matches, and chat are gone from production stores. NFR-3 is 30 days.

## PII in logs

If a sampled log contains name, email, phone, chat body, or an identifying photo URL, rotate the log sink, redact the line, and treat it as an incident. Do not copy the line into the ticket body.

## Restore

Postgres PITR in West Europe. RPO 15 minutes, RTO 4 hours. Rehearse on staging before production. No extra-EU failover.
