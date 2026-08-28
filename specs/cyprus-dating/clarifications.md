# Clarifications: cyprus-dating

Interview record. Canonical terms live in CONTEXT.md.

| # | Question | Answer | Impact |
| --- | -------- | ------ | ------ |
| 1 | Who is the first audience, and what problem are we solving for them? | Residents (Cypriots and settled expats) looking for a relationship, because global apps treat the island as a tourist market. | Starting problem is a local pool polluted by visitors. Later reframed by row 5. |
| 2 | Who counts as a Resident versus a Visitor? | Primary home is on the island. Holiday and short-stay visitors are out of the first audience. Settled expats count; a two-week digital-nomad stay does not. | Resident is a hard audience rule, not a vibe. |
| 3 | Where on the island is the first audience? | Republic of Cyprus only. Expand north later if ever. | Operating area is the south. EU law and GDPR apply. Northern Cyprus is out of v1. |
| 4 | What does looking for a relationship mean as a product rule? | No stated intent. People match and figure it out. | No dating-intent label. "Relationship" describes the user problem (finding people who live here to date), not a product mode. |
| 5 | Which languages does the product speak at launch? | English, Ukrainian, Russian, Romanian, and Bulgarian. | Launch languages are those five. Greek is not in v1. |
| 6 | The first audience included Cypriots, but launch languages omit Greek. Which is right? | Reframe the audience: English-speaking residents plus the Eastern European / Balkan communities in the south. Greek-first Cypriots are a later audience. | Row 1 audience is updated. Cypriots who need a Greek UI are out of v1. |
| 7 | Do people in different language communities share one dating Pool? | One Pool. Language is a Profile attribute and a filter, not a separate app. | Liquidity is not split by language. |
| 8 | Who can seek whom? | Men seeking women and women seeking men only in v1. Other orientations later. | Same-gender matching is out of v1. |
| 9 | Launch city-first, or across the whole Republic with distance-aware discovery? | Whole Republic, distance-aware. Nearer people first; other cities are not shut out. | Operating area is island-wide in the south, not Limassol-only. |
| 10 | Is the Resident rule a hard gate or an honour system? | A Visitor cannot use the app. Primary-home is a gate, not a Profile badge. How we check is design. | R-1 is an enforced gate. Proof mechanism is not a requirement. |
| 11 | How do two Residents meet in v1? | Classic loop: Profile with photos, discover nearby Residents, express Interest, mutual Interest opens chat, block and report. No events, video, or social feed in v1. | Defines R-4, R-5, R-8, R-9, R-10 and the related out-of-scope list. |
| 12 | What ages can join? | 21 and over. No 18-20. | Age floor is 21, not the legal majority of 18. |
| 13 | Where do people use this? | React Native to cover iOS and Android, and a web app. | R-14 is iOS, Android, and web. React Native is a stack preference, not a ratified stack. |
| 14 | Does v1 charge anyone? | Free to join, discover, match, and chat. Optional paid extras later. | Core loop is free. Monetisation extras are out of v1. |
| 15 | How do we keep fake Profiles out? | Photo verification in v1. Unverified Profiles are allowed but marked. | Photo verification is optional, not a discovery gate. KYC is out of v1. |
| 16 | What must be on a Profile for v1? | Lean Profile: photos, first name, age, city, languages spoken, short bio. Filters for age, distance, and languages. | R-4 and R-12. Nothing else is required. |
| 17 | Where does personal data live? | Personal data stays in the EU. GDPR applies. Right to access and delete. No selling of Profile data. | NFR-1 to NFR-4. |
| 18 | Have we reached a shared understanding of v1? | Yes. Write this up as the requirements bundle. | Requirements phase can be recorded. |
| 19 | Stack under the sanctioned ids? | Proposed: Expo (React Native) for iOS, Android, and web, plus a TypeScript API. Recorded as stack C. Auth is an Account session token (hmac-session in the schema, not Entra). Azure EU; web on Static Web App; API on Container Apps. | Needs confirmation. Mobile is not a sanctioned archetype. |
| 20 | How is the Resident gate checked? | Proposed: Cyprus mobile number, a presence check in the Operating area at join, and an attestation that primary home is there. Exact proof is still design. | R-1 stays a gate; this is the first concrete mechanism, not confirmed. |
| 21 | Test seams? | Proposed: API integration tests as the highest seam for gate, discovery, Interest, Match, Block, and deletion. Client tests for Profile, discovery states, unverified mark, and chat. Vendor stubbed in CI. | Needs confirmation. |
| 22 | Photo verification and who-you-meet as special-category? | Recorded as special-category (biometrics and possible sexual orientation). dpoReviewed is false until a DPO signs off. | db check will flag this until DPO review. |
