# Host / introductions

Here is a host, not a catalog. The atomic unit is a proposed evening — who, city, why — not a swipe stack. One conversation with Here. Mutual yes opens the existing Match and human chat. Here is not a third wheel in that thread.

## Now

- After join, a Resident without a Profile talks to Here (first name, city, languages, a few lines). That is the same thread as Introductions. Edit profile from the Profile tab stays a form.
- After a Profile exists, the main loop is `GET /v1/introductions` plus yes / pass. The Discover deck is not the main loop.
- An Introduction shows first name, city, languages spoken, an honest why, and a suggested meet framing. No GPS. No live km.
- Verbs: Yes, Not this, Tell me more.
- Yes records existing Interest. Mutual Interest becomes a Match and opens human chat. Here does not write in that chat.
- Not this records an existing Pass. That person is not proposed again.
- Tell me more earns one editorial portrait plus the person’s own written bio. Not a photo pile. The portrait is held back in the conversation until that verb.
- Introductions expire after 24 hours. The island is small; an unanswered evening does not linger. Expiry is not a Pass — they may be proposed again later.
- The island map stays as where-people-are. It is not the way you meet someone.

## Model may see

- First name, city, languages spoken, and whether the viewer shares a city or a language.
- The subject’s written bio, quoted after Tell me more — never rewritten.
- The first Profile photo, shown after Tell me more.
- Photo verification mark, shown after Tell me more.
- Resident status, men-seeking-women / women-seeking-men, existing Interest, Pass, Block, and Match — so Here proposes someone the viewer can actually meet.

## Model must not invent

- Biographies, jobs, hobbies, or a character the Profile did not write.
- Pickup lines, conversation scripts, or a message into the Match.
- Profession, interest-tag pills, Super Like, or a who-liked-you inbox.
- Exact home GPS, live km, or a pin on a house.
- Northern Cyprus, or matching across the Green Line.
- SMS OTP.

This slice ranks Introductions from Profile facts and an optional want. An optional EU-hosted OpenAI-compatible model may pick `profileId` from the visible Pool. Reasons still come from `introductionReason` / `meetFraming` and must quote a clause that already exists. There is no live LLM in CI: unset `HOST_MODEL_URL` uses the local ranker, and any timeout, error, or unknown id falls back to it. A hostname such as `*.openai.azure.com` is not treated as EU by itself; `HOST_MODEL_REGION` or `DATA_REGION` must be an EU Azure region.

## Yes / Not this

- `POST /v1/introductions/:introductionId/yes` is Interest. It is not visible to them until it is mutual.
- `POST /v1/introductions/:introductionId/pass` is a Pass. Here proposes someone else and keeps the last want until the Resident asks again.
- A Visitor cannot receive or answer an Introduction. A Resident without a Profile is refused (`profile_required`).
- Block and Report remain available from the Introduction. Un-match remains on an existing Match.

## Expiry

- Each Introduction has `expiresAt` 24 hours after it is issued.
- GET re-issues if the held Introduction has expired or the subject is no longer visible.
- POST `/v1/introductions` with `{ want }` tells Here who you are hoping to meet. Here replaces the open Introduction (not a Pass) and ranks the Pool on city, shared language, photo verification, and overlap with the written bios and the want. If the want names a launch language (English, Ukrainian, Russian, Romanian, Bulgarian), Here only proposes someone who speaks it. If nobody left in the Pool does, Here does not substitute someone who speaks a different language. Reasons quote a clause that already exists in the Profile bio. They must not invent a job, a nationality, or a character.
- Yes or Not this on an expired Introduction returns `410 introduction_expired`.
- Expiry does not write a Pass.

## Safety

- Resident-only. Operating area cities and Launch languages only.
- Photo verification mark stays. Unverified is visible after Tell me more, not a Pool exclusion.
- Block, Report, Un-match, and the safety sheet stay.
- Here does not stay in the Match. After mutual yes, the two people talk to each other.

## Not this slice

- A live LLM call in CI. Ranking is local unless `HOST_MODEL_URL` is set outside CI, and even then copy stays grounded.
- Letting the model write bios, jobs, pickup lines, or Match chat.
- T9 Block and Report, and T10 Photo verification, as new work — those already exist and are not marked done here.
- Super Like, who-liked-you, SMS OTP, exact home GPS, live km, Northern Cyprus, profession, interest-tag pills, an AI pickup-line writer.
