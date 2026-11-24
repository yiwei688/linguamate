# LinguaMate — Feature Specification

**A web application for English speaking practice with tag-based partner matching, peer-to-peer voice sessions, and a server-side record of every practice.**

- Full service: runs locally with `node:http` + `node:sqlite` (see *Running locally*).
- Public demonstration build: <https://yiwei688.github.io/linguamate/> — static interface preview only, see *Deployment modes*.

---

## 1. Overview

Most speaking-practice products place two strangers in a call with no shared context and no fallback when the conversation stalls. LinguaMate organises the session around three ideas:

1. **Shared context first.** Every learner carries interest tags and a social-preference tag. Discovery is built on overlap rather than randomness.
2. **Two deliberate tracks.** A *Comfort* track pairs learners who share tags; a *Stretch* track deliberately pairs learners whose topics do not overlap, or whose level is higher.
3. **Never an empty screen.** Idle detection surfaces a rescue prompt after eight seconds; the partner list stays visible so a learner can invite someone else.

---

## 2. Typical user flow

```
Register / sign in
      ↓
Matching hall  →  pick a track (Comfort | Stretch)
      ↓
Partner list (real accounts in that track + sample partners)
      ↓
Invite  →  invitee accepts  →  room opens
      ↓
Voice practice (microphone / headset toggles, voice bubbles, idle hints)
      ↓
Session ends  →  one record is written for each participant
      ↓
Personal dashboard  →  history, topic radar, achievements
```

---

## 3. Feature set (implemented)

### 3.1 Accounts

| Item | Behaviour |
| --- | --- |
| Registration | Account (2–20 characters: letters, digits, underscore), password, confirmation, mainland China mobile number, email, and a four-character refreshable captcha |
| Validation | Each field is validated before submission; errors appear inline beneath the form |
| Password storage | `scrypt` hash with a unique random salt per account; plaintext is never stored |
| Sign-in | Account and password; a failed attempt returns “account or password incorrect” |
| Session | The browser remembers which account is signed in; it holds no password |
| Sign-out | Clears the browser session only |

### 3.2 Partner discovery

| Item | Behaviour |
| --- | --- |
| Tracks | **Comfort** — partners sharing at least one tag. **Stretch** — partners with no shared tag, or a higher level |
| Pool | 30 seeded sample partners plus every real account currently in the same track |
| Ordering | Real accounts first, with an *online* badge; sample partners follow |
| Paging | Four cards per page with a *refresh* action; the sample pool rotates fully |
| Presence | A learner appears in a track only after selecting it; presence expires after 12 seconds without a heartbeat |
| Card content | Initial-based avatar, account name, CEFR-style level, tags, and a shared-tag or topic-difference indicator |

### 3.3 Rooms and invitations

| Item | Behaviour |
| --- | --- |
| Create room | Choose Comfort or Stretch, then the room opens with a six-character code |
| Join room | Enter the code; a full room is rejected explicitly |
| Invite | Inviting a real account opens a room and delivers a blocking invitation dialog to the invitee, showing the inviter's tags |
| Invitation handling | Accept joins the room immediately; decline removes the invitation; several invitations are listed and handled one by one |
| Timer | Starts only when both participants are present |
| Departure | If one participant leaves, the other sees a centred notice and can leave with one action |

### 3.4 Voice practice session

| Item | Behaviour |
| --- | --- |
| Audio | WebRTC peer-to-peer; audio never passes through the application server |
| Signalling | Exchanged over HTTP polling every 0.8 s; no WebSocket dependency |
| Microphone | Explicit toggle; permission errors are described in the interface |
| Headset | Explicit toggle, muted by default — no audio is played until it is enabled |
| Voice bubbles | Local loudness detection produces `🎤 N seconds` bubbles for both participants (speech-to-text is not yet integrated) |
| Idle detection | After eight seconds without speech or bubbles, a rescue sentence appears; it is read aloud only when clicked |
| Speech synthesis | Built-in browser TTS for the suggested phrases |
| Session record | Written by the server for **both** participants when a session ends |

### 3.5 Session records

| Rule | Behaviour |
| --- | --- |
| Minimum duration | Sessions under one minute are not recorded |
| Short sessions | One to three minutes are recorded and shown in red in the history |
| Fields | Participant, partner account, duration, track, partner tags, timestamp |
| Consistency | Both participants receive a record from a single server-side operation, so one side cannot be missing |

### 3.6 Personal dashboard

Level and tags; total practice minutes; session count; date of the most recent session; the last twenty sessions grouped by year, each showing date, partner, track and partner tags.

### 3.7 Growth profile and achievements

| Item | Behaviour |
| --- | --- |
| Topic radar | Eight interest topics; radius = minutes spent on each; social-preference tags are excluded from topic statistics |
| Fallback | Fewer than three topics are shown as a ranked list instead of a radar |
| Achievements | Eight rules evaluated server-side: first session, five-day streak, ten-minute session, stretch session completed, 300 accumulated minutes, three distinct partners, B2 level, and twenty transcript reviews |

---

## 4. Deployment modes

| Capability | Full service (local) | Static demo (GitHub Pages) |
| --- | --- | --- |
| Interface and navigation | ✓ | ✓ |
| Sign-in | ✓ database-backed | ✓ fixed demo accounts (`demo` / `123456`) |
| Registration | ✓ persisted | ✗ resets on page reload |
| Partner list and paging | ✓ | ✓ sample partners only |
| Invitations between real accounts | ✓ | ✗ |
| Rooms and voice calls | ✓ | ✗ requires the API service |
| Session records | ✓ persisted | ✗ |
| Dashboard, radar, achievements | ✓ computed from records | ✓ computed from sample records |

The demo build carries a persistent banner identifying itself as a static demonstration and is not a substitute for the full service.

---

## 5. Data model

| Table | Columns |
| --- | --- |
| `users` | `id`, `account`, `pass_hash`, `pass_salt`, `phone`, `email`, `level`, `tags`, `created_at` |
| `partners` | `id`, `name`, `level`, `tags`, `color` — sample partner pool |
| `practices` | `id`, `user_account`, `partner_name`, `minutes`, `created_at`, `mode`, `partner_tags` |

Transient state (rooms, invitations, presence, signalling messages) is held in memory and cleared when the service restarts.

## 6. API surface

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/register` | create an account |
| `POST` | `/api/login` | verify credentials, return profile |
| `GET` | `/api/partners` | paged partner matching for a track |
| `GET` / `POST` | `/api/practices` | list or record practice sessions |
| `GET` | `/api/profile` | dashboard, history, topics, achievements |
| `POST` | `/api/presence` | heartbeat with the current track |
| `POST` / `GET` | `/api/invite`, `/api/invites` | send and read invitations |
| `POST` | `/api/invite/respond` | accept or decline |
| `POST` | `/api/room/create`, `/api/room/join` | room lifecycle |
| `GET` | `/api/room/state` | room state and caller role |
| `POST` / `GET` | `/api/signal` | WebRTC signalling exchange |
| `POST` | `/api/room/leave` | leave; records the session for both participants |

---

## 7. Architecture notes

- **No UI framework.** Views are hand-written DOM with a small hash router; each screen owns one module.
- **No server framework.** A single `node:http` handler with explicit routes.
- **Single-file database.** `node:sqlite`; the database file is created on first start and seeded with sample data.
- **Audio is peer-to-peer.** The server only relays session descriptions and network candidates.
- **Server-side accounting.** Session records are produced by the server, not by either client, so both participants always receive one.

## 8. Known limitations

| Limitation | Consequence |
| --- | --- |
| No speech-to-text | Voice bubbles show duration only, not transcript |
| No relay (TURN) server | Calls work on the same machine or local network; some corporate or mobile networks will not connect |
| Rooms held in memory | A service restart ends all open rooms |
| No authentication token | Account identifiers travel in request parameters; acceptable for a local demonstration, not for public deployment |
| No rate limiting or abuse protection | Not intended for open internet exposure |
| Static demo cannot register persistently | Demo accounts are reset on reload |

## 9. Roadmap

1. Speech-to-text for transcripts and language-dimension scoring.
2. Level-assessment flow with an initial learning profile.
3. Friend list, practice community feed, and structured peer feedback.
4. Token-based authentication and a deployable server configuration.
