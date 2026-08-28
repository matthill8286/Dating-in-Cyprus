# data-classification: cyprus-dating

<!-- Generated from data-classification.json by the design-and-build runner. Edit the JSON and re-render; do not hand-edit this file. -->

## piiPresent

true


## dpoReviewed

false


## dataElements

- **name:** Account identifiers (email or phone, auth secrets); **category:** personal; **lawfulBasis:** Contract (provide the dating service the Resident asked for).; **retention:** Until Account deletion, then purged from production stores within 30 days.; **crossBorder:** None. EU only.
- **name:** Profile fields (first name, age, city, languages spoken, bio); **category:** personal; **lawfulBasis:** Contract.; **retention:** Until Account deletion, then purged within 30 days.; **crossBorder:** None. EU only.
- **name:** Profile photos; **category:** personal; **lawfulBasis:** Contract.; **retention:** Until Account deletion or photo removal, then purged within 30 days.; **crossBorder:** None. EU only.
- **name:** Approximate location used for distance-aware discovery; **category:** personal; **lawfulBasis:** Contract (discovery by distance is core to the service). Precise live pin is out of scope.; **retention:** Last known city and coarse location while the Account is active; purged on deletion.; **crossBorder:** None. EU only.
- **name:** Gender and who-you-meet preference; **category:** special-category; **lawfulBasis:** Explicit consent. This can reveal sexual orientation, which is special-category under GDPR Article 9.; **retention:** Until Account deletion or consent withdrawal, then purged within 30 days.; **crossBorder:** None. EU only.
- **name:** Photo verification biometric (liveness or face-match); **category:** special-category; **lawfulBasis:** Explicit consent. Biometric data for identification is special-category under GDPR Article 9.; **retention:** Store the pass/fail mark and time. Do not retain the vendor raw template in this product; vendor retention must be contracted to the minimum needed to perform the check.; **crossBorder:** Vendor must process in the EU. No transfer outside the EU.
- **name:** Chat message bodies; **category:** personal; **lawfulBasis:** Contract.; **retention:** Until Account deletion of either party or Match end plus a short moderation hold (up to 30 days), then purged.; **crossBorder:** None. EU only.
- **name:** Interest, Match, Block records; **category:** personal; **lawfulBasis:** Contract.; **retention:** Until Account deletion, then purged within 30 days.; **crossBorder:** None. EU only.
- **name:** Reports and moderation notes; **category:** personal; **lawfulBasis:** Legitimate interest (safety of Residents) and legal obligation where a report must be retained.; **retention:** Active Account lifetime, or up to 12 months after a closed Report if needed for repeat-abuse review, then purged.; **crossBorder:** None. EU only.
- **name:** Device push tokens; **category:** personal; **lawfulBasis:** Legitimate interest (deliver Match and message notifications the Resident enabled).; **retention:** Until token invalid, permission withdrawn, or Account deletion.; **crossBorder:** Push vendors (Apple, Google) receive the token. Prefer EU endpoints; APNs/FCM are a known extra-EU transfer with SCCs as safeguard if the vendor has no EU-only path.

