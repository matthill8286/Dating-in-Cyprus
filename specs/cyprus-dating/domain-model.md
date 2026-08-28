# domain-model: cyprus-dating

<!-- Generated from domain-model.json by the design-and-build runner. Edit the JSON and re-render; do not hand-edit this file. -->

## ubiquitousLanguage

- **term:** Resident; **definition:** A person whose primary home is in the Operating area. Settled expats count; a holiday or short-stay visitor does not.
- **term:** Visitor; **definition:** A person in the Operating area whose primary home is not. Holiday, business trip, and a short digital-nomad stay are Visitors.
- **term:** Operating area; **definition:** The Republic of Cyprus. Not Northern Cyprus, and not matching across the Green Line, in v1.
- **term:** Pool; **definition:** The single set of Residents who can discover each other. There is one Pool, not one per Launch language.
- **term:** Launch language; **definition:** One of English, Ukrainian, Russian, Romanian, or Bulgarian. The languages the product speaks in v1.
- **term:** Profile; **definition:** The photos, first name, age, city, languages spoken, and short bio a Resident shows to others.
- **term:** Interest; **definition:** A one-way expression that a Resident wants to Match with another Resident they can see.
- **term:** Match; **definition:** The state after two Residents have Interest in each other, which opens chat.
- **term:** Photo verification; **definition:** A check that the person in the Profile photos is the person holding the phone. Unverified Profiles stay in the Pool and are marked.
- **term:** Account; **definition:** The login identity of a Resident. Distinct from the Profile they show.
- **term:** Report; **definition:** A Resident's flag of another Resident for moderation (fake, harassment, Visitor, or other abuse).
- **term:** Block; **definition:** A one-way cut: the blocked Resident disappears from the blocker's discovery and cannot message them.


## entities

- **name:** Resident; **description:** A person admitted to the Pool because their primary home is in the Operating area.; **invariants:** ["Must be 21 or over.","Must pass the Resident gate; a Visitor cannot become a Resident by self-declaration alone.","Has exactly one Account and at most one Profile in the Pool."]
- **name:** Account; **description:** The authenticated identity a Resident uses to sign in.; **invariants:** ["Is unique per person.","Can be deleted; deletion removes the Profile, photos, Matches, and chat from production stores within 30 days."]
- **name:** Profile; **description:** What other Residents see: photos, first name, age, city, languages spoken, short bio, and Photo verification mark.; **invariants:** ["Belongs to exactly one Resident.","Shows first name, age, city, languages spoken, short bio, and photos.","Does not carry a dating-intent label.","Unverified Profiles remain in the Pool and are marked unverified."]
- **name:** Pool; **description:** The one set of discoverable Residents in the Operating area.; **invariants:** ["There is one Pool, not one per Launch language.","Only Residents appear in it.","Matching in v1 is men seeking women and women seeking men only."]
- **name:** Interest; **description:** A one-way want-to-Match from one Resident toward another they can see.; **invariants:** ["The actor can see the target in discovery at the time they express Interest.","Interest is not visible to the target until it is mutual.","Mutual Interest becomes a Match."]
- **name:** Match; **description:** Two Residents who have Interest in each other, which opens chat between them only.; **invariants:** ["Exists only after mutual Interest.","Chat is only between the two matched Residents.","A Block from either side ends the Match for messaging and discovery."]
- **name:** Photo verification; **description:** Evidence that the person in the Profile photos is the person holding the phone.; **invariants:** ["A pass marks the Profile verified; a fail or skip leaves it unverified.","Unverified is a visible mark, not a discovery exclusion."]
- **name:** Report; **description:** A moderation flag from one Resident about another.; **invariants:** ["Has a reporter, a subject, and a reason.","Does not by itself remove the subject from the Pool; moderation does."]


## boundedContexts

- Identity and gate: Account, Resident gate, age, deletion. Owns whether a person is in the Pool.
- Profile and discovery: Profile, Pool, distance-aware discovery, language and age filters. Owns what is shown and who can be seen.
- Matching: Interest, Match, Block. Owns the path from discovery to chat.
- Conversation: chat after a Match. Does not own Match creation.
- Trust and moderation: Photo verification, Report, Block. Owns marks and removal from the Pool.
- Photo verification vendor (external): liveness or face-match. This product stores the pass/fail mark, not the vendor's raw biometric template, if the vendor allows that split.

