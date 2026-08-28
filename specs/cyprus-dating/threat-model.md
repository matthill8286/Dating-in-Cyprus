# threat-model: cyprus-dating

<!-- Generated from threat-model.json by the design-and-build runner. Edit the JSON and re-render; do not hand-edit this file. -->

## dataFlows

- Expo iOS, Android, and web clients call the TypeScript API in Azure EU over TLS with an Account session token
- A person submits join (age 21+, Launch language, attestation of primary home, Cyprus mobile, presence in the Operating area) and the API creates an Account only if the Resident gate passes
- The API reads and writes Profile, Interest, Match, chat, Block, and Report in the EU personal data store using managed identity
- The API stores Profile photos in the EU photo store and issues short-lived signed URLs to an authorised session
- The client completes optional Photo verification with the vendor; the API stores only the pass/fail mark and time, not the raw biometric template
- The API delivers Match and new-message push to iOS and Android using a device token bound to the Account
- Authenticated discovery returns Pool Profiles (nearer first) to a gated Resident; chat bodies move only between the two parties of a Match


## assets

- Account session token
- HMAC signing key held by the API
- Account identifiers (email or Cyprus mobile, auth secrets)
- Resident gate evidence (Cyprus mobile, presence at join, attestation)
- Profile fields (first name, age, city, languages spoken, bio)
- Profile photos
- Gender and who-you-meet preference (special-category)
- Approximate location used for distance-aware discovery
- Chat message bodies
- Interest, Match, Block, and Report records
- Photo verification biometric processed by the vendor; pass/fail mark in this product
- Device push tokens


## threats

- **id:** T1; **category:** spoofing; **description:** A person publishes a fake Profile (stolen photos or a fabricated identity) and appears in the one Pool as a Resident, which in a small island market can crowd out real people.; **severity:** high; **mitigation:** Discovery requires at least one photo. The unverified mark is visible and is not client-set. Report and Block are first-class: a Block removes the subject from the blocker's discovery and chat; moderation can remove a Profile from the Pool after a Report. Rate-limit Account and Profile create per Cyprus number and per device. Residual: Photo verification is optional, so unverified fakes remain in the Pool by design.
- **id:** T2; **category:** spoofing; **description:** A stolen or forged Account session token is replayed so an attacker acts as another Resident (read chat, photos, Matches, or change the Profile).; **severity:** high; **mitigation:** HMAC session token signed with a Key Vault key and verified with timingSafeEqual on every API call that reads or writes personal data. Token is not placed in URLs or logs. Native Expo clients keep it in SecureStore; web uses a Secure, HttpOnly, SameSite cookie. TLS 1.2 or higher. Rotate on logout and credential change; idle expiry. Residual: a token stolen from an unlocked device remains valid until expiry or rotation.
- **id:** T3; **category:** elevation-of-privilege; **description:** A Visitor bypasses the Resident gate (self-declaration, client-side flag, or a forged presence check) and enters the Pool.; **severity:** high; **mitigation:** The gate runs only on the API, never as a client-only flag. Join requires a Cyprus mobile number, a presence check in the Operating area at join, and an attestation of primary home; a Visitor is refused even if they attest. Age 21 or over is checked server-side. Residual: a Visitor with a Cyprus number who is physically in the Operating area at join can still pass; this is not government ID or KYC.
- **id:** T4; **category:** info-disclosure; **description:** An authenticated client or script pages through discovery and harvests every Profile in the one Pool, including photos and who-you-meet preference.; **severity:** high; **mitigation:** Discovery and other people's Profile reads require a valid session of a gated Resident. Paginate and rate-limit discovery and Profile reads per Account. Data export returns only the caller's own personal data, not the Pool. Photo bytes are short-lived signed URLs so scraped page HTML does not keep working. No unauthenticated Pool endpoint.
- **id:** T5; **category:** tampering; **description:** A matched Resident floods or sends abusive chat, or an attacker injects messages into a thread they do not belong to.; **severity:** high; **mitigation:** The API accepts chat send and read only if the session Account is one of the two parties of an active Match. A Block from either side ends the Match for messaging. Report carries a reason for moderation. Rate-limit messages per Match and per Account. Residual: v1 has no automated content scan; safety after a Match relies on Block, Report, and human moderation.
- **id:** T6; **category:** info-disclosure; **description:** Profile photos leak from the photo store via a public container, a guessable URL, or an identifying URL written to logs.; **severity:** high; **mitigation:** Azure Blob in an EU region; private container with anonymous public access disabled. The API issues short-lived signed URLs only to an authorised session. Encryption at rest. Identifying photo URLs are never written to application logs (NFR-4). Photos are purged within 30 days of removal or Account deletion.
- **id:** T7; **category:** info-disclosure; **description:** Device push tokens leak from logs, a loosely scoped API, or another Resident's response, enabling unwanted push or device correlation.; **severity:** medium; **mitigation:** Tokens are stored only on the API, bound to the Account, never returned to other clients, and never logged. Push is sent only for a new Match or new message when notification permission is granted. Tokens are deleted on logout, permission withdrawal, or Account deletion.
- **id:** T8; **category:** info-disclosure; **description:** An unverified Photo verification vendor retains, transfers outside the EU, or leaks raw liveness or face-match biometric data (special-category).; **severity:** high; **mitigation:** Vendor is contracted to process in the EU under a DPA before any live traffic. Explicit consent before liveness or face-match. This product stores the pass/fail mark and time, not the vendor raw biometric template; vendor retention is contracted to the minimum needed to perform the check. Residual: liveness quality is vendor-dependent and is not KYC.
- **id:** T9; **category:** elevation-of-privilege; **description:** An authenticated Resident reads or writes another pair's Match or chat by guessing or iterating resource ids (IDOR), including sending chat without a Match.; **severity:** high; **mitigation:** Every Match and chat read or write checks that the session Account is one of the two parties. Chat is refused when there is no Match or after a Block. Opaque (non-sequential) ids. Generic 404 for non-members so probing does not confirm existence. API integration tests cover Match, chat, and Block IDOR cases.
- **id:** T10; **category:** spoofing; **description:** The client, or an untrusted vendor callback, marks a Profile verified without a liveness or face-match against that Profile's photos.; **severity:** high; **mitigation:** The API ignores a client-supplied verified flag. The mark is set only from a vendor result bound to the Account (signed webhook or server-side vendor call). Fail or skip leaves the Profile unverified and still marked as such in the Pool.
- **id:** T11; **category:** repudiation; **description:** A Resident denies sending a chat message, expressing Interest, or filing a Report after moderation is asked to act.; **severity:** medium; **mitigation:** The API records Interest, Match, Block, Report, and chat-send with Account id, counterpart id, resource id, and timestamp. Chat bodies stay in the chat store for the retention window so moderation can review them; they are not written to application logs. Residual: without KYC, Account-to-person binding is weak.
- **id:** T12; **category:** denial-of-service; **description:** Flooded join, discovery, Interest, or chat exhausts the v1 capacity (10,000 registered, 1,000 weekly active) or locks a Resident out of discovery and messaging.; **severity:** medium; **mitigation:** Rate-limit join, discovery, Interest, and chat per Account and per IP. Timeouts on store and vendor calls. Capacity is planned for the island scale in NFR-7, not an unbounded global crawl.
- **id:** T13; **category:** info-disclosure; **description:** The HMAC signing key leaks into the Expo bundle, an API response, or logs, so an attacker can forge Account session tokens.; **severity:** high; **mitigation:** The HMAC key stays in Azure Key Vault and is read by the API via managed identity. It is never sent to clients, never placed in the Expo bundle, and never logged.


## boundaryMitigations

- **boundary:** client <-> API (account session); **mitigation:** TLS 1.2 or higher. HMAC Account session token, signed with a Key Vault key, verified with timingSafeEqual on every call that reads or writes personal data. Token is not placed in query strings or logs. Native Expo clients keep it in SecureStore; web uses a Secure, HttpOnly, SameSite cookie. HMAC key and Resident gate logic are not in the client bundle. Rate-limit join, discovery, Interest, and chat per Account.
- **boundary:** API <-> personal data store (Profile, Match, chat); **mitigation:** EU Azure store only, reached with managed identity. Encryption at rest. The API allows a session to read or write a Profile only if it owns it, and Match or chat only if it is one of the two parties. Parameterised access. Application logs contain no name, email, phone, chat body, or identifying photo URL. Account deletion purges Profile, Matches, and chat from production within 30 days.
- **boundary:** API <-> photo store; **mitigation:** Private blob container in an EU region with anonymous public access disabled. The API issues short-lived signed URLs only to an authorised session. Encryption at rest. Identifying photo URLs are not logged. Photos are purged within 30 days of removal or Account deletion.
- **boundary:** client <-> photo verification; **mitigation:** Vendor processes in the EU under a DPA; explicit consent before liveness or face-match. The Expo client does not set the verified mark. The API sets pass or fail only from a vendor result bound to the Account. This product stores the mark and time, not the vendor raw biometric template. Residual: Photo verification is optional and liveness quality depends on the vendor; it is not government ID.
- **boundary:** client <-> push delivery; **mitigation:** Device tokens are stored only on the API, bound to the Account, never returned to other clients, and never logged. Push is sent only for a new Match or new message when the Resident has granted permission. Tokens are deleted on logout, permission withdrawal, or Account deletion. Residual: APNs and FCM may transfer the token outside the EU; SCCs are the safeguard if there is no EU-only path.

