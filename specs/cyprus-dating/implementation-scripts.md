# Implementation Plan: cyprus-dating

Parent Spec: specs/cyprus-dating/spec.md

Each task below is a copy-paste prompt for a fresh chat window. Run them in order; blocked-by
relationships are noted on each task.

## Task 1: Scaffold Expo app, TypeScript API, OpenAPI, and EU Postgres

Blocked by: none

```
Source: specs/cyprus-dating/plan.md: Scaffold Expo app, TypeScript API, OpenAPI, and EU Postgres
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

Build the walking skeleton for cyprus-dating. This is a separate consumer product from Uinsure: no shared identity, data, or brand, and no Entra.

Stack
- Expo (React Native) client in apps/client targeting iOS, Android, and web (R-14). Do not scaffold a Vite SPA from the Uinsure fe-core profile as the app shell. Keep the gap-closing baseline: strict TypeScript, ESLint, Prettier, Vitest, coverage thresholds on logic, OpenAPI publish plus generated client.
- TypeScript Fastify API in apps/api (stack C): helmet, CORS allow-list, sensible, @fastify/swagger off zod contracts, pino, esbuild bundle, HMAC session auth (node:crypto, timingSafeEqual). Deploy shape is Azure Container Apps in an EU region.
- OpenAPI 3 published from the API. Version in the URL as /v1. Clients use a generated TypeScript client (openapi-typescript + openapi-fetch). No hand-written API client.
- Postgres in an EU region (NFR-1). Local docker-compose for development. Config must refuse to boot if the configured data region is not EU. Photo store will be Azure Blob in the same EU region; stub the blob client in CI.
- Client state: React Context. Styling: Tailwind v4 where it applies. Forms: yup. Client auth: session token.
- Capacity: plan for 10,000 registered Residents and 1,000 weekly active, not millions (NFR-7). Single API process, no shard story.
- Application logs must not contain name, email, phone, chat body, or an identifying photo URL (NFR-4). Configure pino redact paths now so later tasks inherit them.
- axe against Expo web; wire WCAG 2.2 AA into the web test path (NFR-6).

What to build
- apps/api health at /health and OpenAPI at the swagger path, with scripts/emit-openapi.ts writing openapi.json.
- apps/client boots on iOS, Android, and web. app config lists those three platforms. A smoke screen calls GET /health through the generated client.
- HMAC session middleware present (unauthenticated health; authenticated stub for later resources).
- Glossary lives in CONTEXT.md. Use Resident, Visitor, Operating area, Pool, Launch language, Profile, Interest, Match, Photo verification, Account. The product has no name yet.

Seams
- API integration: health, OpenAPI document exists, config rejects a non-EU region.
- Contract: generated client types match the OpenAPI document.
- Client: Expo web smoke screen renders the health result; platform config includes ios, android, web.
- Log sample from the health path contains none of the NFR-4 fields.

Acceptance
- Three platforms are configured and the client can talk to the API via the generated client.
- Personal data stores are configured for EU only.
- Quality gate: format, lint, type-check, test for every affected package.

Out of scope
- Join, gate, Profile, discovery, matching, chat, paywall, Greek UI, Northern Cyprus.
```

## Task 2: Account join with age 21+ and session

Blocked by: Task 1

```
Source: specs/cyprus-dating/plan.md: Account join with age 21+ and session
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

Add Account join to cyprus-dating on the Expo client and TypeScript API. HMAC session. OpenAPI + generated client. Postgres EU. TDD vertical slices.

What to build
- POST /v1/accounts (or equivalent) creates an Account and returns a session.
- Only a person aged 21 or over can join (R-2). Under 21 is refused. Ages 18 to 20 are out of v1. Store date of birth; display age later on the Profile. Do not allow an age edit that would put the person under 21.
- Join collects: date of birth, chosen Launch language (English, Ukrainian, Russian, Romanian, Bulgarian), explicit consent for gender and who-you-meet (special-category under GDPR Article 9). Gender and who-you-meet are matching data, not Profile display fields. Lean Profile is Task 4.
- Sign-in with the same Account reissues a session. Session is required for later resources.
- Join screen on iOS, Android, and web with yup validation.

Seams
- API integration: join at 21 succeeds; join at 20 is refused; join at 21 with a valid payload issues a session that authorises a subsequent authenticated request; unauthenticated protected route is 401.
- Logs from join contain no name, email, phone, chat body, or identifying photo URL.
- Client: join form refuses under-21 locally and shows the API refusal; successful join stores the session.

Acceptance
- An adult 21+ can create an Account and hold a session.
- A person under 21 cannot join.
- OpenAPI and generated client updated.

Out of scope
- Resident gate (Task 3), Profile fields, discovery, paywall, Entra.

Use CONTEXT.md terms. Account is the login identity, distinct from Profile.
```

## Task 3: Resident gate

Blocked by: Task 2

```
Source: specs/cyprus-dating/plan.md: Resident gate
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

Enforce the Resident gate on cyprus-dating. Only a Resident can join and later appear in the Pool. A Visitor is refused at the gate (R-1). Operating area is the Republic of Cyprus. Northern Cyprus and matching across the Green Line are out of v1.

Mechanism (design proposal, implement this unless the repo already records a different confirmed proof)
- Cyprus mobile number.
- A presence check in the Operating area at join.
- An attestation that primary home is in the Operating area.
A Visitor cannot become a Resident by self-declaration alone. How we check is this gate, not a Profile badge. Government ID and KYC are out of v1.

What to build
- Extend join so the Account is admitted only after the gate passes. Failed gate: no Resident, no session that can reach Pool resources.
- Presence check and mobile check are server-side. Stub geo and SMS vendors in CI; inject via API options as in apps/api/src/app.ts.
- Client: join journey collects mobile, attestation, and presence permission; shows a clear refusal when the gate fails.
- Domain: Resident has exactly one Account and at most one Profile. Use the glossary: Resident, Visitor, Operating area.

Seams
- API integration: a person who fails mobile, presence, or attestation is refused; a person who passes all three is admitted; a Visitor cannot call a Pool-scoped route.
- Client: gate failure and gate success states.
- Logs from the gate path contain no NFR-4 personal data.

Acceptance
- Visitors cannot complete join.
- Residents who pass the gate hold a session that later tasks can use.
- OpenAPI and generated client updated.

Out of scope
- Discovery listing (Task 5) still must also exclude Visitors; this task owns admission. Profile, matching, Greek UI.
```

## Task 4: Lean Profile with no dating-intent label

Blocked by: Task 3

```
Source: specs/cyprus-dating/plan.md: Lean Profile with no dating-intent label
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

Give a Resident a lean Profile (R-4) and ensure the product does not require or display a dating-intent label (R-16).

Profile shows: photos, first name, age, city, languages spoken, short bio. Nothing else is required. Age is derived from date of birth. City is in the Operating area. Languages spoken are Profile attributes (not a separate Pool). At least one photo is required to appear in discovery later; exact extra photo count is your design, keep it small.

What to build
- /v1/profiles resources: create and update own Profile, get own Profile, get another Resident's Profile only when the caller is a Resident.
- Photo upload to the EU photo store; stub the blob client in CI.
- Expo Profile edit screen and Profile view. Unverified mark comes in Task 10; do not add a dating-intent control, field, enum, or copy.
- OpenAPI schema for Profile must not include an intent, looking-for, or relationship-goal field. Tests must fail if such a field is added.
- React Context holds the current Profile. yup on the edit form.

Seams
- API integration: Resident can publish a lean Profile; missing required fields refused; Visitor/unauthenticated cannot; response and schema contain no dating-intent label.
- Client component tests for Profile view and edit, including the absence of intent UI.
- Contract tests from OpenAPI against the generated client.

Acceptance
- Lean Profile round-trips on API and client.
- R-16 is locked by tests on schema, API, and UI.
- Photos stored in the EU.

Out of scope
- Discovery list, Photo verification vendor, chat, paywall.
```

## Task 5: Distance-aware discovery in one Pool with filters

Blocked by: Task 4

```
Source: specs/cyprus-dating/plan.md: Distance-aware discovery in one Pool with filters
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

Discovery for cyprus-dating: one Pool, nearer first, with filters.

Requirements
- A Resident discovers other Residents across the Operating area, nearer people first (R-5).
- Everyone is in one Pool. Language is a Profile attribute and a filter, not a separate Pool (R-6). An English-speaking Resident must see a Ukrainian-speaking Resident when not filtering that language out.
- Filters: age, distance, languages spoken (R-12).
- Only a Resident appears in discovery (R-1). Visitors, incomplete Profiles, and Profiles with no photo are excluded.
- Distance is city plus approximate distance, not a live map pin.
- Discovery request to first result render p95 < 2s on typical Cyprus 4G, excluding photo bytes (NFR-5). Add a k6 script against the discovery endpoint; keep photo bytes out of the measurement.

What to build
- GET /v1/discovery with filter query params. Ordering by distance. Single Pool: no language-siloed collections or routes.
- Expo discovery screen: list or cards, filters, empty, loading, error, populated.
- Matching rule (men seeking women / women seeking men) is Task 6; this slice may still return both genders so Task 6 has a failing test to hang off. Do not split the Pool by language.

Seams
- API integration: nearer first; one Pool across Launch languages; filters applied server-side; Visitor and blocked-later cases wait for Task 9; non-Resident excluded.
- Client component tests: empty, error, populated.
- k6 for NFR-5.
- Logs from discovery contain no NFR-4 personal data.

Acceptance
- Demo: two Residents in different Launch languages and cities appear in one list, nearer first, filterable.
- OpenAPI and generated client updated.

Out of scope
- Gender matching rule (Task 6), Interest, paywall, live map, Northern Cyprus.
```

## Task 6: Men seeking women and women seeking men matching rule

Blocked by: Task 5

```
Source: specs/cyprus-dating/plan.md: Men seeking women and women seeking men matching rule
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

Enforce v1 matching: men seeking women and women seeking men only (R-7). Same-gender matching and anything beyond that pair is out of v1. Enforce on the API. The client must not be the only filter.

What to build
- Discovery (and later Interest) only includes people the caller is allowed to meet under the rule: a man seeking women sees women seeking men, and the reverse.
- Gender and who-you-meet collected at join with explicit consent remain special-category. Do not put them on the public Profile as extra display fields.
- Client discovery should not show people the API would hide; still treat the API as source of truth.

Seams
- API integration: man seeking women does not receive men; woman seeking men does not receive women; a same-gender pair cannot appear in each other's discovery; a man seeking women does receive a woman seeking men.
- Contract: discovery response shape unchanged aside from membership of the Pool subset.

Acceptance
- The Pool is still one Pool (R-6 remains true). The matching rule subsets who you see, it does not create a second Pool.
- OpenAPI and generated client updated if the contract needs a field already collected at join.

Out of scope
- Interest, chat, additional orientations, dating-intent labels.
```

## Task 7: Interest and Match

Blocked by: Task 6

```
Source: specs/cyprus-dating/plan.md: Interest and Match
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

Classic loop: express Interest, mutual Interest opens a Match (R-8, R-9). Chat is Task 8.

Invariants
- Interest is a one-way want-to-Match from one Resident toward another they can see in discovery at that time.
- Interest is not visible to the target until it is mutual.
- Mutual Interest becomes a Match.
- You cannot express Interest in someone you cannot see (Visitor, wrong matching rule, self, or later a Block).

What to build
- POST /v1/interests and GET own Match list. Creating the second Interest of a pair creates the Match.
- Expo: Interest from a Profile; Matches list. No events, video, or social feed.
- Join, discovery, Match stay free; do not add a paywall here (R-15 is asserted in Task 14).

Seams
- API integration: Interest in a visible Resident succeeds; Interest in someone not in your discovery is refused; one-way Interest does not notify or appear on the target; mutual Interest creates exactly one Match; duplicate Interest is idempotent.
- Client: Profile Interest action; Matches list empty and populated.
- Logs from Match creation contain no NFR-4 personal data.

Acceptance
- Two Residents can Match. One-way Interest does not open chat.
- OpenAPI and generated client updated.

Out of scope
- Chat messages (Task 8), Block, push, Photo verification.
```

## Task 8: Chat after Match

Blocked by: Task 7

```
Source: specs/cyprus-dating/plan.md: Chat after Match
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

When a Match exists, the two Residents can chat (R-9). Chat is only between those two. Conversation context does not own Match creation.

What to build
- /v1/matches/{id}/messages: list and send. Unmatched pairs cannot chat. A third Resident cannot read or write the thread.
- Expo chat thread and Matches list entry into the thread. Client component tests for the thread (empty, sending, populated, error).
- Chat bodies stored in EU Postgres. Application logs must never contain chat body (NFR-4).
- Push for a new message is Task 13; this slice can persist messages without device push.

Seams
- API integration: matched pair can send and list; non-match is refused; outsider is refused; message bodies stored and returned; sampled log line from send/list contains no chat body, name, email, phone, or identifying photo URL.
- Client component tests for the chat thread.
- Contract tests from OpenAPI.

Acceptance
- Demo: mutual Interest, then a message appears for both.
- OpenAPI and generated client updated.

Out of scope
- Block ending the thread (Task 9), push, video, read receipts beyond a simple delivered list if you need them for the test.
```

## Task 9: Block and Report

Blocked by: Task 8

```
Source: specs/cyprus-dating/plan.md: Block and Report
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

A Resident can block another Resident and can report them (R-10). Block and Report from Profile or chat.

Block
- One-way cut: the blocked Resident disappears from the blocker's discovery and cannot message them.
- A Block from either side ends the Match for messaging and discovery.

Report
- Reporter, subject, reason (fake, harassment, Visitor, or other abuse).
- Report does not by itself remove the subject from the Pool; moderation does. There is no moderation inbox UI required in v1 beyond persisting the Report.

What to build
- /v1/blocks and /v1/reports.
- Expo actions on Profile and chat. After Block, discovery and chat honour the cut.

Seams
- API integration: Block hides the person from discovery both ways as specified; blocked person cannot message; existing Match cannot send; Report persists with reason; Report does not remove the subject from the Pool; you cannot Block or Report yourself.
- Client: Block and Report available from Profile and from chat.

Acceptance
- Glossary: Block and Report as in CONTEXT.md and the domain model.
- OpenAPI and generated client updated.

Out of scope
- Automated takedown, KYC, public moderation dashboard.
```

## Task 10: Photo verification mark

Blocked by: Task 5

```
Source: specs/cyprus-dating/plan.md: Photo verification mark
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

A Resident can complete Photo verification. An unverified Profile is allowed in the Pool and is marked as unverified (R-11). This is not KYC and not a government ID check.

Invariants
- A pass marks the Profile verified; a fail or skip leaves it unverified.
- Unverified is a visible mark, not a discovery exclusion.
- Store the pass/fail mark and time. Do not retain the vendor raw biometric template in this product.
- Vendor must be EU. Stub the vendor in CI; no live Photo verification vendor in CI.
- Result p95 < 15s (NFR-9). Measure against the stub and document the budget; do not wait on a live vendor.

What to build
- /v1/photo-verifications: start and result. Profile payload includes verification status.
- Expo: entry from Profile edit and Settings; unverified mark on Profile view and on discovery cards.
- Client component tests for the unverified mark.

Seams
- API integration: unverified Profile still returned in discovery with the mark; pass flips the mark; fail/skip stay unverified; vendor stubbed.
- Client: unverified mark visible; verified state visible.
- Timing test or k6 against the stubbed result path for NFR-9.

Acceptance
- Unverified people remain in the Pool and are visibly marked.
- OpenAPI and generated client updated.

Out of scope
- Blocking unverified people from discovery, KYC, selling biometric data.
```

## Task 11: Launch languages i18n

Blocked by: Task 9, Task 10

```
Source: specs/cyprus-dating/plan.md: Launch languages i18n
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

The product is used in the Launch languages: English, Ukrainian, Russian, Romanian, and Bulgarian (R-3). Greek UI is out of v1. Greek-first Cypriots are a later audience.

What to build
- i18n for every v1 screen: join, gate, Profile, discovery, Interest, Matches, chat, Block, Report, Photo verification, settings.
- Language picker at join (already collected) and in settings. Changing Launch language changes UI copy; it does not move the person into a different Pool.
- Strings for all five Launch languages. No Greek resource bundle in v1.
- axe against Expo web screens in each Launch language; WCAG 2.2 AA, no serious or critical axe issues (NFR-6).

Seams
- Client tests: each Launch language can render the main journeys without missing-key fallbacks for required copy.
- axe on Expo web.
- Assert there is no Greek locale pack.

Acceptance
- A Resident can use the app in any Launch language and still sees the same Pool.
- OpenAPI only changes if you persist UI language on the Account (already collected at join).

Out of scope
- Greek UI, language-siloed Pools, translating chat bodies.
```

## Task 12: Data export and Account deletion

Blocked by: Task 9, Task 10

```
Source: specs/cyprus-dating/plan.md: Data export and Account deletion
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

A person can export their personal data and can delete their Account and personal data (R-13, NFR-3). Profile and chat data are not sold (NFR-2).

What to build
- Export: authenticated download of held personal data (Account identifiers, Profile fields, photos metadata, coarse location, gender and who-you-meet, Photo verification mark, chat, Interest, Match, Block, Reports they filed). Export is to the Account holder only. No third-party sale, broker, or analytics dump of Profile fields, photos, or chat contents.
- Delete: Account deletion removes Profile, photos, Matches, and chat from production stores within 30 days. After delete, the person cannot sign in; their Profile is gone from the Pool. Reports may follow the recorded retention (up to 12 months after a closed Report if needed for repeat-abuse review) but Profile, photos, Matches, and chat must still meet the 30-day production purge.
- Settings screens: export and delete with a confirmation. yup on the confirm step.
- Deletion and export logs contain no name, email, phone, chat body, or identifying photo URL (NFR-4). Sample join, discovery, Match, chat, and deletion log lines in a test that the redaction still holds.

Seams
- API integration: export returns the holder's data and not another person's chat beyond the shared thread they were in; delete removes Pool visibility immediately or within the documented process, with a job or synchronous purge covered by a test that production stores are clear within the 30-day rule (use a clock/test double for the deadline).
- Assert no code path posts Profile or chat to a non-EU or commercial buyer endpoint.
- Client: export download; delete confirmation and signed-out state.

Acceptance
- GDPR access and erase for the Account.
- OpenAPI and generated client updated (DataExport resource).

Out of scope
- Selling data, extra-EU transfer, Uinsure identity linkage.
```

## Task 13: Push for Match and message

Blocked by: Task 8

```
Source: specs/cyprus-dating/plan.md: Push for Match and message
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

Push is delivered for a new Match and a new message on iOS and Android when notification permission is granted (NFR-8). Web is not required to receive push.

What to build
- Register a device push token against the Account. Permission request on iOS and Android. Prefer EU endpoints; if APNs/FCM have no EU-only path, keep tokens as the known extra-EU transfer already recorded in data classification, with no Profile or chat body in the payload.
- On Match created and on message created, enqueue a push. Payload: no chat body, no name beyond a generic title if required, no identifying photo URL.
- Vendor (APNs/FCM) stubbed in CI. Inject clients via API options.
- Settings: notification permission state.

Seams
- API integration: with permission and a token, Match creates a push; message creates a push; without permission, no push; stub captures payload and asserts it has no chat body or identifying photo URL.
- Client: permission grant stores a token; revoke stops registration.

Acceptance
- iOS and Android can receive the two event types in a stubbed test.
- OpenAPI and generated client updated.

Out of scope
- Web push, email, marketing push, paywall upsell notifications.
```

## Task 14: Free core with no paywall

Blocked by: Task 8

```
Source: specs/cyprus-dating/plan.md: Free core with no paywall
Use TDD (red-green-refactor, vertical slices — one test at a time, not all tests first) to implement the task.

Join, discovery, Match, and chat are free. Paid extras are later, not v1 (R-15). This task is a check, not a payments build.

What to build
- Automated tests that join, discovery, Interest, Match, and chat succeed without a subscription, IAP, payment method, feature-flag paywall, or quota that blocks the core loop.
- Assert OpenAPI and client routes for those resources have no paymentRequired, entitlements, or similar gate.
- Assert Expo screens for join, discovery, Matches, and chat have no paywall, upgrade, or subscribe control.
- Do not add a store, Stripe, or IAP SDK.

Seams
- API integration: a newly joined Resident can discover, Match, and chat without any billing header or purchased flag.
- Client: those screens render the core loop with no payment UI.
- Repo search/test: no payment SDK dependency required by the core packages.

Acceptance
- R-15 is locked by tests. Charging for join, discovery, Match, or chat remains out of v1.

Out of scope
- Designing paid extras, ads, or boosts.
```
