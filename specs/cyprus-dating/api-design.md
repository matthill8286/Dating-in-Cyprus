# api-design: cyprus-dating

<!-- Generated from api-design.json by the design-and-build runner. Edit the JSON and re-render; do not hand-edit this file. -->

## resources

- **name:** Account; **operations:** ["POST /accounts","POST /sessions","GET /accounts/me/export","DELETE /accounts/me"]
- **name:** Profile; **operations:** ["GET /profiles/me","PATCH /profiles/me","GET /profiles/{profileId}"]
- **name:** Discovery; **operations:** ["GET /discovery"]
- **name:** Interest; **operations:** ["POST /interests"]
- **name:** Match; **operations:** ["GET /matches","GET /matches/{matchId}"]
- **name:** Match message; **operations:** ["GET /matches/{matchId}/messages","POST /matches/{matchId}/messages"]
- **name:** Block; **operations:** ["POST /blocks"]
- **name:** Report; **operations:** ["POST /reports"]
- **name:** Photo verification; **operations:** ["POST /photo-verifications","GET /photo-verifications/{photoVerificationId}"]


## versioning

URL prefix /v1. Clients opt in by calling paths under /v1. Paths are kebab-case; JSON fields are camelCase. Additive, backwards compatible changes stay on /v1. A breaking change is a new prefix such as /v2. This API is new and has no prior contract.


## pagination

GET /discovery uses keyset pagination: the client sends limit and an opaque cursor of last distance plus Profile id, so nearer Residents in the Pool stay first and a growing list does not shift pages. GET /matches and GET /matches/{matchId}/messages also use keyset cursors. Offset pagination is not used.


## idempotency

Clients send an Idempotency-Key header on join (POST /accounts), Interest (POST /interests), and Report (POST /reports). A retry with the same key and the same body returns the original response and does not create a second Account, Interest, or Report. GET is safe. DELETE /accounts/me is naturally idempotent.


## errorTaxonomy

- Every error body is {code, message, details}. message is UK English. details is an optional object of field or gate facts. Logs must not copy name, email, phone, chat body, or an identifying photo URL from details.
- 400 validation_failed: join, Profile update, or discovery filters fail schema or business rules (missing attestation, bio length, invalid Launch language or age filter).
- 401 unauthenticated: missing, expired, or invalid Account session.
- 403 visitor_refused: the Resident gate refuses a Visitor at join (R-1).
- 403 age_ineligible: the person is under 21 at join (R-2).
- 403 interest_not_allowed: the actor cannot see the target in discovery, so Interest is refused.
- 403 chat_not_allowed: list or send messages when there is no Match, or a Block has ended the Match for messaging.
- 404 not_found: Profile, Match, Photo verification, or message list is missing, or GET /profiles/{profileId} is not allowed (blocked, outside the Pool, or not a visible Resident), so existence is not leaked.
- 409 conflict: join when an Account already exists for that person, or Interest already recorded for that pair.
- 410 account_deleted: the session or resource refers to an Account that has been deleted.
- 429 rate_limited: join, Interest, Report, or discovery exceeds the fair-use limit.
- 502 photo_verification_unavailable: the Photo verification vendor is down or times out.


## breakingChange

false

