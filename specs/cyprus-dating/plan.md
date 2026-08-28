# plan: cyprus-dating

<!-- Generated from plan.json by the design-and-build runner. Edit the JSON and re-render; do not hand-edit this file. -->

## slices

- **id:** S1; **summary:** Scaffold Expo app, TypeScript API, OpenAPI, and EU Postgres; **notes:** Walking skeleton: Expo client on iOS, Android, and web (R-14); Fastify TypeScript API on Azure Container Apps; OpenAPI 3 at /v1 with generated client; Postgres and photo store in an EU region (NFR-1); HMAC session plumbing; PII-redacting logs (NFR-4); axe on Expo web (NFR-6); sized for 10,000 registered Residents (NFR-7). Not a Vite SPA copy of the Uinsure fe-core profile.
- **id:** S2; **summary:** Account join with age 21+ and session; **notes:** Create an Account, refuse under 21 (R-2), issue an HMAC session. Collect date of birth, Launch language, and explicit consent for gender and who-you-meet (special-category). Gender is matching data, not a Profile display field.
- **id:** S3; **summary:** Resident gate; **notes:** A Visitor is refused at join and cannot become a Resident by self-declaration alone (R-1). Proposed check: Cyprus mobile number, a presence check in the Operating area at join, and an attestation that primary home is there. Operating area is the Republic of Cyprus only.
- **id:** S4; **summary:** Lean Profile with no dating-intent label; **notes:** Photos, first name, age, city, languages spoken, short bio (R-4). At least one photo to appear in discovery. Schema, API, and UI must not require or display a dating-intent label (R-16).
- **id:** S5; **summary:** Distance-aware discovery in one Pool with filters; **notes:** One Pool for all Launch-language communities (R-6). Nearer Residents first across the Operating area (R-5). Filters: age, distance, languages spoken (R-12). City and approximate distance, not a live map pin. Discovery p95 < 2s excluding photo bytes (NFR-5). Only Residents with at least one photo appear.
- **id:** S6; **summary:** Men seeking women and women seeking men matching rule; **notes:** Discovery only returns the v1 matching rule (R-7). Same-gender matching is out of v1. Enforced on the API, not only the client.
- **id:** S7; **summary:** Interest and Match; **notes:** A Resident can express Interest in someone they can see in discovery (R-8). Interest is one-way and not shown to the target until mutual. Mutual Interest creates a Match (R-9).
- **id:** S8; **summary:** Chat after Match; **notes:** A Match opens chat between those two Residents only (R-9). Chat bodies stay in the EU and must never appear in application logs.
- **id:** S9; **summary:** Block and Report; **notes:** Block and Report from Profile or chat (R-10). A blocked Resident disappears from the blocker's discovery and cannot message them. Report does not by itself remove the subject from the Pool.
- **id:** S10; **summary:** Photo verification mark; **notes:** Optional Photo verification. Unverified Profiles stay in the Pool and are marked unverified (R-11). Vendor stubbed in CI. Result p95 < 15s (NFR-9). Not KYC.
- **id:** S11; **summary:** Launch languages i18n; **notes:** The product UI is used in English, Ukrainian, Russian, Romanian, and Bulgarian (R-3). Greek UI is out of v1. axe WCAG 2.2 AA on Expo web screens in each Launch language (NFR-6).
- **id:** S12; **summary:** Data export and Account deletion; **notes:** Export held personal data from the Account. Deletion removes Profile, photos, Matches, and chat from production stores within 30 days (R-13, NFR-3). No runtime path sells Profile or chat data (NFR-2). Deletion logs stay free of PII (NFR-4).
- **id:** S13; **summary:** Push for Match and message; **notes:** Push on iOS and Android for a new Match and a new message when notification permission is granted (NFR-8). Vendor stubbed in CI. Web is not required to receive push.
- **id:** S14; **summary:** Free core with no paywall; **notes:** Join, discovery, Match, and chat are free. Assert there is no payment, subscription, or feature-gate on those paths (R-15). Paid extras are later, not v1.

