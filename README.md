# LinguaMate

**Find a language partner who actually wants to talk about the same things — then practise speaking with a real voice call and an AI co-pilot at your side.**

Most speaking-practice tools give you a random stranger and an empty chat box. LinguaMate starts from what you already like: it reads your interest and social tags, proposes one topic a day, and matches you two ways — a *Comfort* track built on shared tags, and a *Stretch* track that deliberately pairs you with someone from a different topic space. When a human partner is not available in time, the AI takes over so the session never ends in an empty screen.

> Interface copy is currently in Chinese; the codebase and this README are in English.

## Features

**Available now**

- **Accounts** — sign up / sign in, passwords stored as `scrypt` hashes with a per-user salt (never plaintext).
- **Two-track matching** — Comfort matches partners who share at least one tag; Stretch matches partners with no tag overlap or a higher level. Filtering runs on the server, not in the browser.
- **Live partner list** — real accounts appear in the list for the mode they picked, pinned first with an online badge; invite one and they get a blocking accept/decline dialog.
- **Rooms** — create a room with a mode, share the 6-character code, or join one; the timer only starts when both people are in.
- **Two-person voice room** — WebRTC peer-to-peer audio with separate *microphone* and *headset* toggles, automatic `🎤 N seconds` bubbles from local loudness detection, an 8-second idle rescue hint, browser TTS for phrases, and a "partner left" notice.
- **Daily topic** — a rotating conversation prompt with ready-to-use sentence starters in English plus a Chinese gloss.
- **Personal dashboard** — level, tags, total minutes, session count, and the last 20 sessions grouped by year, with mode and partner tags.
- **Practice records** — written server-side for both participants when a session ends; anything under one minute is not recorded.

**In progress**

- Growth radar (topic distribution and language dimensions) with achievement badges.
- Optional speech-to-text for the bubble placeholders.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Vite + TypeScript, hand-written DOM — no UI framework |
| Backend | `node:http` — no Express, no Fastify |
| Database | `node:sqlite` — one file, no server, no port |
| Crypto | `node:crypto` (`scrypt` + random salt) |

The only dependencies are Vite and TypeScript. Everything else is Node standard library or browser API.

## Getting started

Requires **Node.js 22.5+** (developed on Node 24; TypeScript files are run directly by Node, no build step for the server).

```bash
npm install

# terminal 1 — API + database (creates data/app.db on first run)
node server/index.ts

# terminal 2 — web app
npm run dev
```

Open http://localhost:5173 and sign in with the demo account:

```
account:  demo
password: 123456
```

The database is seeded on first start with 30 sample partners and 20 practice records for the demo account. Delete `data/app.db` to start over.

## Project layout

```
src/            browser app
  main.ts       login / register views + hash routing
  lobby.ts      matching hall
  api.ts        the single place that talks to the server
  auth.ts       session handling
server/
  index.ts      HTTP API (register, login, partners, practices)
  db.ts         schema, seeding, password hashing
data/app.db     SQLite file (git-ignored)
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/register` | create an account |
| `POST` | `/api/login` | verify credentials, return profile |
| `GET` | `/api/partners?mode=&tags=&level=&offset=` | paged partner matching |
| `GET` | `/api/practices?account=` | recent sessions |
| `POST` | `/api/practices` | record a finished session |

## Data model

- `users` — account, password hash + salt, phone, email, level, tags
- `partners` — name, level, tags, avatar colour
- `practices` — owning account, partner name, minutes, timestamp

## Status

Runs end to end: register → sign in → pick a track → get matched → leave with a record in the database. Voice practice, dashboard and growth charts are the next milestones.
