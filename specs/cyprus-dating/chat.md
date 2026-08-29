# Chat / messaging

Match opens a private thread between the two parties. Join, discovery, Match, and chat stay free.

## Now

- Persist and list messages on `GET/POST /v1/matches/:matchId/messages`.
- Only the two Match parties can read or send. Outsiders get a generic 404.
- Match list and detail include `lastMessage` (`body`, `fromMe`, `sentAt`) or `null`.
- The client polls the open thread every 4 seconds and shows the last-message preview on Matches.
- Chat bodies are redacted in application logs (`body`, `req.body`, `req.body.body`).

## Next

- Push for a new Match and a new message (T13 / NFR-8), gated on notification permission.
- `since` cursor on message list so poll is incremental.
- Block from either party ends the thread for messaging.

## Not v1

- Websockets or a long-lived stream.
- Typing indicators and read receipts.
- Media, voice, or location in the thread.
- A “who liked you” inbox. Interest stays private until it is mutual.
