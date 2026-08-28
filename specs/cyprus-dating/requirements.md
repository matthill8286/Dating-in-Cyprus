# requirements: cyprus-dating

<!-- Generated from requirements.json by the design-and-build runner. Edit the JSON and re-render; do not hand-edit this file. -->

## problem

People whose primary home is in the Republic of Cyprus cannot find other residents to date. Global apps treat the island as a tourist market, so the local pool is noisy and short-stay. The first audience is English-speaking residents and the Ukrainian, Russian, Romanian, and Bulgarian-speaking communities. Greek-first Cypriots are a later audience.


## goals

- A Resident can discover other Residents nearby, match, and chat.
- A Visitor cannot enter the Pool.
- Launch-language communities share one Pool.
- Fake and unverified Profiles are visible as such, and a person can block and report, so a small market is not taken over by fakes.


## functional

- **id:** R-1; **text:** Only a Resident can join and appear in discovery. A Visitor is refused at the gate.
- **id:** R-2; **text:** Only a person aged 21 or over can join.
- **id:** R-3; **text:** The product is used in the Launch languages: English, Ukrainian, Russian, Romanian, and Bulgarian.
- **id:** R-4; **text:** A person has a lean Profile: photos, first name, age, city, languages spoken, and a short bio.
- **id:** R-5; **text:** A person discovers other Residents across the Operating area, with nearer people first.
- **id:** R-6; **text:** Everyone is in one Pool. Language is a Profile attribute and a filter, not a separate Pool.
- **id:** R-7; **text:** Matching is men seeking women and women seeking men only.
- **id:** R-8; **text:** A person can express Interest in another person they can see in discovery.
- **id:** R-9; **text:** When Interest is mutual, a Match opens and the two people can chat.
- **id:** R-10; **text:** A person can block another person and can report them.
- **id:** R-11; **text:** A person can complete Photo verification. An unverified Profile is allowed in the Pool and is marked as unverified.
- **id:** R-12; **text:** A person can filter discovery by age, distance, and languages spoken.
- **id:** R-13; **text:** A person can export their personal data and can delete their account and personal data.
- **id:** R-14; **text:** The product is used on iOS, Android, and the web.
- **id:** R-15; **text:** Join, discovery, Match, and chat are free. Paid extras are later, not v1.
- **id:** R-16; **text:** The product does not require or display a dating-intent label.


## nonFunctional

- **id:** NFR-1; **text:** Personal data is stored and processed in the EU. No transfer outside the EU.
- **id:** NFR-2; **text:** Profile and chat data are not sold.
- **id:** NFR-3; **text:** Account deletion removes Profile, photos, Matches, and chat from production stores within 30 days. An export of held personal data is available from the account.
- **id:** NFR-4; **text:** Application logs contain no name, email, phone, chat body, or identifying photo URL.
- **id:** NFR-5; **text:** Discovery request to first result render p95 < 2s on typical Cyprus 4G, excluding photo bytes.
- **id:** NFR-6; **text:** WCAG 2.2 AA on all web screens.
- **id:** NFR-7; **text:** Capacity planned for 10,000 registered Residents and 1,000 weekly active.
- **id:** NFR-8; **text:** Push is delivered for a new Match and a new message on iOS and Android when notification permission is granted.
- **id:** NFR-9; **text:** Photo verification result p95 < 15s.


## constraints

- Operating area is the Republic of Cyprus only.
- GDPR applies.
- Separate product from Uinsure D2C. No shared identity, data, or brand with the insurance stack.
- How the Resident gate is checked is a design decision, not a v1 requirement on a particular proof.
- Stack preference, not ratified: React Native for iOS and Android, plus a web client.


## assumptions

- At least one photo is required to appear in discovery. Exact photo count is design.
- Distance is shown as city and approximate distance, not a live map pin.
- A blocked person disappears from discovery and cannot message the person who blocked them.
- The product does not yet have a name.
- Push for Match and message on mobile is in v1 (stated as NFR-8 without a separate interview question).


## outOfScope

- Northern Cyprus and matching across the Green Line
- Greek UI and Greek-first Cypriots as a core audience
- Same-gender matching and matching beyond men seeking women and women seeking men
- Ages 18 to 20
- Visitors and short stays
- Events, video calls, and a social feed
- Government ID or KYC
- Charging for join, discovery, Match, or chat
- Dating-intent labels
- Language-siloed Pools


## terms

- Resident
- Visitor
- Operating area
- Pool
- Launch language
- Profile
- Interest
- Match
- Photo verification

