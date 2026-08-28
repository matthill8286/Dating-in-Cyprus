# React Context, Tailwind, yup, session-token client

v1 client state is Account session, Profile, discovery list, and the open Match. That is not a large graph, so React Context rather than MobX-State-Tree. Tailwind v4 for one token set across Expo web and native styling where it applies. yup for join, Profile, and filter forms. Client auth is a session token on the Account, not MSAL.

Status: proposed

NFR-6 (web a11y still applies to Expo web).
