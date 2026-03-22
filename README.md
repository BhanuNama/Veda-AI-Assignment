# VedaAI — AI Assessment Creator

Full-stack **AI Assessment Creator** for teachers: design assignments, generate **structured** question papers with an LLM (no raw markdown dumps), track jobs in real time, review papers with answer keys, and export **server-side PDFs**. The UI follows the hiring brief’s **Figma** direction and adds product-level polish, extra screens, and production-oriented deployment.

**Figma (reference):** [VedaAI — Hiring Assignment](https://www.figma.com/design/nB2HMm1BhTpmHcHrmEslGB/VedaAI---Hiring-Assignment?node-id=0-1&t=UjYQLgEek4u99AA4-1)

---

## Table of contents

1. [Assignment coverage](#1-assignment-coverage)  
2. [Features beyond the brief](#2-features-beyond-the-brief)  
3. [Architecture](#3-architecture)  
4. [Approach & design decisions](#4-approach--design-decisions)  
5. [Repository layout](#5-repository-layout)  
6. [Backend API](#6-backend-api)  
7. [WebSocket protocol](#7-websocket-protocol)  
8. [Data model (MongoDB)](#8-data-model-mongodb)  
9. [AI pipeline](#9-ai-pipeline)  
10. [Caching & limits](#10-caching--limits)  
11. [Frontend surfaces](#11-frontend-surfaces)  
12. [Local setup](#12-local-setup)  
13. [Deployment notes](#13-deployment-notes)  
14. [Scripts](#14-scripts)

---

## 1. Assignment coverage

| Brief requirement | Where it lives / notes |
|-------------------|------------------------|
| **Figma-based assignment form** | `CreateForm.tsx`, `FileUpload.tsx`, `QuestionTypeRow.tsx` — progress strip, card layout, pill inputs, dashed upload zone; **desktop** table-style question rows; **mobile** stacked cards with inset steppers. |
| **File upload (optional)** | Multipart upload; PDF/text extraction; images via **Tesseract.js** OCR (best-effort, timeout). |
| **Due date, time, instructions** | Due date picker (`DD-MM-YYYY` display, ISO in state); time allowed; optional instructions + **Web Speech API** dictation (mic). |
| **Question types + counts + marks** | Dynamic rows; add/remove; validation (min counts/marks). |
| **Zustand** | `store/useAppStore.ts` — assignments, pending job, generation step, toasts, theme. |
| **WebSocket** | `hooks/useWebSocket.ts` — connect with `jobId`; **exponential reconnect**; **HTTP polling fallback** if WS fails. |
| **Structured AI output (no raw LLM UI)** | Groq chat with `response_format: json_object` → strip fences → **Zod** schema → extra invariants (MCQ options, answer key). UI only renders typed `QuestionPaper`. |
| **Sections A/B/…, difficulty, marks** | Sections per question type; `DifficultyBadge`; MCQ options when applicable. |
| **Express + TS, MongoDB, Redis, BullMQ** | `backend/src` — Mongoose models, `queueService`, `generationWorker`, job processor. |
| **Flow: API → queue → worker → store → notify** | `routes/assignments.ts` → BullMQ → `jobService.ts` → Mongo + Redis cache → `broadcast` WS. |
| **Output page: student lines, sections, hierarchy** | `QuestionPaper.tsx`, `AnswerKey.tsx` — Name / Roll / Class & Section lines; responsive exam-style layout. |
| **PDF download (bonus)** | **Server:** PDFKit — `paper` \| `key` \| `both`. **Client:** `usePDF` (html2canvas + jsPDF) available for capture-by-DOM if needed. |
| **Regenerate (bonus)** | Clears Redis paper cache, resets assignment, re-queues with `variationSeed` + `avoidQuestions` from prior paper. |
| **Difficulty visuals (bonus)** | `Badge.tsx` / `DifficultyBadge`. |

---

## 2. Features beyond the brief

These are implemented in code but were not all spelled out in the one-pager:

| Feature | Description |
|---------|-------------|
| **Assignments hub** | `AssignmentGrid` — search (title/subject/grade/topic), **status** filters (all / ready / generating / pending / failed), **subject** filter, **sort** (newest, oldest, A–Z), empty state, **FAB** create, card animations. |
| **Assignment card actions** | Kebab menu: open, delete; status-aware UI. |
| **Delete assignment** | `DELETE /api/assignments/:id` + Redis `paper:` key removal. |
| **Home dashboard** | Stats: assignment count, total generated questions (from loaded data), distinct subjects; recent assignments list with deep links. |
| **Calendar** | `app/calendar/page.tsx` — `react-day-picker`, highlights **created** vs **due** dates; side lists for selected day; quick link to create. |
| **Paper report modal** | Post-generation **stats** (totals, difficulty mix, heuristic time) + **blueprint summary** when blueprint was used (`blueprintMeta` from worker). |
| **Assessment blueprint (optional on create)** | Target **difficulty %** and **topic weight %**; prompt enforces `meta.topic`; worker computes **coverageScore** vs targets. |
| **Generating UX** | `GeneratingView` — spinner + **4-step checklist** driven by WS `job:step` (labels aligned with worker). |
| **Failed generation** | Dedicated UI with **Regenerate** calling same API as action bar. |
| **Theme** | Light/dark; `ThemeProvider` + `localStorage` (`veda-theme`); sidebar toggle. |
| **Responsive shell** | Desktop **sidebar** (gradient logo, nav badges, create CTA); **mobile** header + **bottom nav**; main column offset for sidebar width. |
| **Toast system** | Global feedback for API errors, deletes, downloads, etc. |
| **CORS hardening** | `FRONTEND_URL` **normalized** (trailing slash stripped) so `Access-Control-Allow-Origin` matches browser `Origin` exactly (fixes Vercel + Render). |
| **Redis TLS** | `rediss://` + username from URL supported for cloud Redis (e.g. Upstash). |
| **Health check** | `GET /health` — Mongo, Redis, BullMQ sanity for ops. |
| **AI repair loop** | Up to **3** attempts: first full prompt, then repair prompts with Zod/validation error text. |
| **Regeneration diversity** | Previous question texts passed as **avoid** list + random **variationSeed**. |
| **Placeholder product areas** | **My Groups**, **AI Teacher’s Toolkit**, **My Library** — routed shell pages (library shows empty state); ready for future scope. |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Next.js 14 (App Router) — frontend/                       │
│  Pages: home, assignments CRUD flow, assignment detail, create, calendar     │
│  State: Zustand · API: lib/api.ts · Realtime: useWebSocket (+ poll fallback) │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTPS  /api/*
                                    │ WSS    /ws?jobId=
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Node.js + Express + TypeScript — backend/                │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────────────────────────┐  │
│  │ REST routes  │  │ WebSocket   │  │ BullMQ Worker (same process)       │  │
│  │ /api/assign… │  │ /ws         │  │ paper-generation queue, concurrency 3│  │
│  └──────┬───────┘  └──────┬──────┘  └─────────────────┬──────────────────┘  │
└─────────┼─────────────────┼───────────────────────────┼─────────────────────┘
          │                 │                           │
          ▼                 ▼                           ▼
    MongoDB Atlas      Same HTTP server           Groq API
    (assignments,      upgrades to WS             (JSON mode)
     papers, meta)
                              │
                              ▼
                         Redis (ioredis)
                         · BullMQ queue + worker connection
                         · paper:{id} cache (TTL 24h)
```

**End-to-end generation flow**

1. Client **POST** `/api/assignments` (JSON or `multipart` with `formData` + optional `file`).  
2. Server validates caps (**max 60 questions**), extracts file text (truncate for prompt), creates **MongoDB** doc (`pending`), enqueues **BullMQ** job with UUID `jobId`, saves `jobId` on assignment.  
3. Client sets **pendingJob** and opens **WebSocket** to `WS_URL/ws?jobId=…`.  
4. Worker: `generating` → emits **4 steps** → `generateQuestionPaper` (AI + Zod) → saves **paper** + **blueprintMeta** → **SET** Redis cache → **job:completed** (or **job:failed** + `lastError`).  
5. Client updates Zustand; user lands on **assignment detail** with paper, answer key, action bar, optional report modal.

---

## 4. Approach & design decisions

### Frontend

- **Figma fidelity:** Layout tokens (sidebar width, floating panels, assignment toolbar, mobile patterns) while keeping a maintainable Tailwind + CSS variable theme.  
- **Typed API wrapper:** Single `request()` shape `{ success, data | error }` for consistency.  
- **Resilience:** WebSocket reconnect with backoff; polling on `/api/assignments/:id/status` and full fetch as fallback so long jobs still complete if WS drops (mobile networks, sleep tab, etc.).

### Backend

- **No “pretty print the model”:** The model must return **JSON** matching a strict schema; failures become **structured errors** and BullMQ retries, not broken HTML.  
- **Separation:** Routes thin; **fileService** (extract), **aiService** (prompt + validate), **jobService** (orchestration + meta), **pdfService** (layout), **queueService** (Redis + queue).  
- **Read path optimization:** `GET /:id` and `GET /:id/pdf` prefer **Redis** `paper:{id}` when present to avoid large Mongo reads.  
- **Worker colocated:** Same deploy unit as API so one Render service runs HTTP + WS + consumer (simpler ops for this assignment scope).

### AI (Groq)

- **Model:** Configurable via `GROQ_MODEL` (default `llama-3.3-70b-versatile`).  
- **Prompt:** CBSE/ICSE-style brief, per-type section rules, MCQ option rules, answer-key ordering rules; optional **reference text** from uploads; **blueprint** and **regeneration** blocks when applicable.  
- **Validation:** Zod + custom checks (MCQ exactly 4 options, non-MCQ empty options, answer key covers 1..N).

---

## 5. Repository layout

```
Veda-AI/
├── README.md                 # This file
├── .gitignore
├── render.yaml               # Optional Render Blueprint (backend)
├── frontend/
│   ├── src/
│   │   ├── app/              # App Router pages (assignments, create, [id], calendar, home, …)
│   │   ├── components/       # layout, assignments, create, paper, ui
│   │   ├── hooks/            # useWebSocket, usePDF
│   │   ├── lib/api.ts
│   │   ├── store/useAppStore.ts
│   │   └── types/index.ts
│   ├── public/fonts/         # Local font assets
│   └── package.json
└── backend/
    ├── src/
    │   ├── index.ts          # HTTP + WS bootstrap
    │   ├── config.ts
    │   ├── models/Assignment.ts
    │   ├── routes/assignments.ts
    │   ├── services/         # ai, job, queue, file, pdf
    │   ├── workers/generationWorker.ts
    │   └── websocket/wsManager.ts
    ├── .env.example
    └── package.json
```

---

## 6. Backend API

Base path: **`/api/assignments`** (JSON body unless multipart).

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | List assignments (**excludes** `paper` field for payload size). |
| `GET` | `/:id` | Single assignment; merges **paper** from Redis cache when available. |
| `GET` | `/:id/status` | Lightweight status poll (`status`, `jobId`, `lastError`) — WS fallback. |
| `GET` | `/:id/pdf?variant=paper\|key\|both` | Stream **PDFKit** PDF. |
| `POST` | `/` | Create assignment + enqueue job (`formData` JSON or field + optional `file`). |
| `POST` | `/:id/regenerate` | Clear cache, reset paper, re-queue with variation + avoid-list. |
| `DELETE` | `/:id` | Delete document + Redis cache key. |

**Other**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Service health / dependency checks. |

**Upload limits (create route)**

- Multer **50 MB**; extracted text capped for prompt (**30k** chars on route after extraction; fileService also truncates per internal max).  
- **Max 60** total questions per request.

---

## 7. WebSocket protocol

- **URL:** `{WS_ORIGIN}/ws?jobId={uuid}`  
- **Client → server:** connect only (no auth in demo scope).  
- **Server → client** (`WSMessage`):

| Event | Meaning |
|-------|---------|
| `connected` | Subscribed to `jobId`. |
| `job:step` | Progress index + human label (4 steps). |
| `job:completed` | Full `QuestionPaper` in payload. |
| `job:failed` | Error string for UI / toast. |

---

## 8. Data model (MongoDB)

**Assignment** (high level)

- Identity: `title`, `subject`, `grade`, `topic`, `assignedOn`, `due`  
- `status`: `pending` \| `generating` \| `completed` \| `failed`  
- `paper`: nested sections, questions (text, difficulty, marks, options, optional `meta.topic`), `answerKey`  
- `formData`: original teacher input including optional `blueprint`  
- `blueprintMeta`: optional `topicsCovered`, `difficultyCounts`, `coverageScore`  
- `jobId`, `lastError`, timestamps  

---

## 9. AI pipeline

1. `buildPrompt(formData)` — structured instructions + JSON shape example.  
2. Groq `chat.completions.create` with `response_format: { type: 'json_object' }`.  
3. `normalizeAndValidatePaper` — fence stripping, `JSON.parse`, **Zod**, MCQ/answer-key invariants.  
4. On failure: retry with **repair** messages including validation errors (up to 3 total attempts).  
5. `generateFallbackPaper` exists in `aiService.ts` as a **deterministic template** helper (not wired to production path by default).

---

## 10. Caching & limits

| Mechanism | Detail |
|-----------|--------|
| Redis `paper:{assignmentId}` | JSON paper, **EX 86400** (24h); cleared on regenerate/delete; used by GET and PDF. |
| BullMQ | Queue `paper-generation`; **concurrency 3**; retries with backoff on worker throw. |
| List endpoint | Omits `paper` to keep list fast. |

---

## 11. Frontend surfaces

| Route | Role |
|-------|------|
| `/` | Dashboard stats + recent assignments. |
| `/assignments` | Filterable/sortable grid + FAB. |
| `/assignments/create` | Full create form + generation redirect. |
| `/assignments/[id]` | Generating / failed / completed states; paper + key; action bar; report modal. |
| `/calendar` | Due + created calendar + lists. |
| `/groups`, `/toolkit`, `/library` | Shell / placeholder for future modules. |

**Shared UI:** `Topbar`, `Sidebar`, `MobileHeader`, `BottomNav`, `ToastContainer`, `Modal` (confirm patterns).

---

## 12. Local setup

### Prerequisites

- **Node.js ≥ 20**  
- **MongoDB** (local or Atlas)  
- **Redis** (local or cloud; `redis://` or `rediss://`)  
- **Groq API key**

### Backend

```bash
cd backend
cp .env.example .env
# Set: MONGO_URI, REDIS_URL, GROQ_API_KEY, FRONTEND_URL (e.g. http://localhost:3000)
npm install
npm run dev    # or: npm run build && npm start
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001
# NEXT_PUBLIC_WS_URL=ws://localhost:3001
npm install
npm run dev
```

Open **http://localhost:3000**.

---

## 13. Deployment notes

Typical split used in development of this project:

| Part | Platform | Notes |
|------|----------|--------|
| Frontend | **Vercel** | Root **`frontend/`**; env `NEXT_PUBLIC_API_URL` (**https**), `NEXT_PUBLIC_WS_URL` (**wss**). |
| Backend | **Render** (or similar) | Root **`backend/`**; `npm install && npm run build`; `npm start`; **do not** override `PORT`. |
| Secrets | Host env | Never commit `.env` / `.env.local`. |

Set **`FRONTEND_URL`** on the API to the **exact** Vercel origin (no trailing slash; server also normalizes).

**Free tier:** Serverless/idle sleep (e.g. Render free) causes **cold starts** — first request after idle can be tens of seconds; not a bug in app logic.

---

## 14. Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `frontend/` | `npm run dev` | Next dev server (port 3000 in package.json). |
| `frontend/` | `npm run build` | Production build. |
| `frontend/` | `npm run start` | Serve production build. |
| `frontend/` | `npm run lint` | ESLint. |
| `backend/` | `npm run dev` | `tsx watch` on `src/index.ts`. |
| `backend/` | `npm run build` | `tsc` → `dist/`. |
| `backend/` | `npm start` | `node dist/index.js`. |

---

## Submission checklist (hiring brief)

- [x] GitHub repo with clean structure  
- [x] README with **architecture** + **approach** (this document)  
- [x] Setup instructions + env examples  
- [x] Core + bonus features implemented in code  

---

*Built for the VedaAI hiring assignment — AI Assessment Creator.*
