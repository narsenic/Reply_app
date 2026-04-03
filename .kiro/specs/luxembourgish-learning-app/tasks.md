# Implementation Plan: Luxembourgish Learning App

## Overview

Build a full-stack language learning application using React + TypeScript frontend, Node.js/Express + TypeScript backend, PostgreSQL via Railway, S3-compatible storage for media, and Socket.IO for real-time group chat. The app deploys as a single Railway web service serving both the API and the built React SPA. Tasks are ordered to build foundational layers first (project setup, database, auth), then domain modules incrementally, then frontend, and finally integration and deployment wiring.

## Tasks

- [x] 1. Project scaffolding and configuration
  - [x] 1.1 Initialize monorepo with backend and frontend directories
    - Create root `package.json` with workspaces for `server/` and `client/`
    - Initialize `server/` with TypeScript, Express, and Node.js configuration (`tsconfig.json`, `package.json`)
    - Initialize `client/` with Vite + React + TypeScript template
    - Add shared `.env.example` with placeholders for `DATABASE_URL`, `JWT_SECRET`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
    - _Requirements: All (foundational setup)_

  - [x] 1.2 Set up Prisma ORM and database schema
    - Install Prisma in `server/`
    - Create `prisma/schema.prisma` with all models from the design: User, Language, Curriculum, Lesson, ContentBlock, Exercise, AssessmentResult, UserProgress, GroupSession, GroupSessionParticipant, ChatMessage
    - Include the Role enum (USER, ADMIN), all relations, unique constraints (`@@unique([userId, lessonId])`, `@@unique([languageCode, level, skill])`)
    - Create initial migration
    - Add seed script that inserts the default Language record (`code: "lb"`, `name: "Luxembourgish"`, `isDefault: true`)
    - _Requirements: 3.1, 3.2, 10.1, 10.2_

  - [x] 1.3 Set up Express server entry point with middleware
    - Create `server/src/index.ts` with Express app, CORS, JSON body parser, and a health check route (`GET /api/health`)
    - Add global error boundary middleware that catches unhandled errors and returns sanitized `ApiError` JSON responses (no stack traces in production)
    - Add request validation middleware using Zod for body/query/param validation
    - Set up Socket.IO server attached to the HTTP server
    - _Requirements: Error Handling (global middleware)_

  - [x] 1.4 Set up Vitest and testing infrastructure
    - Install Vitest, fast-check, and Supertest in `server/`
    - Create `vitest.config.ts` with node environment and `tests/` include pattern
    - Create `tests/setup.ts` with Prisma test client setup (use test database URL)
    - Create `tests/` directory structure: `unit/`, `properties/`, `integration/`
    - _Requirements: Testing Strategy_

- [x] 2. Authentication module
  - [x] 2.1 Implement user registration endpoint
    - Create `server/src/modules/auth/auth.routes.ts` and `auth.service.ts`
    - Implement `POST /api/auth/register` with Zod validation for email, password (min 8 chars), displayName
    - Hash password with bcrypt (salt rounds 10+)
    - Generate email verification token, store user in DB
    - Send verification email via SMTP (use nodemailer)
    - Return field-specific validation errors for invalid input
    - _Requirements: 1.1, 1.2, 1.3, 1.7_

  - [ ]* 2.2 Write property tests for registration
    - **Property 1: Password hashing invariant** — For any password, stored hash is valid bcrypt, not equal to plaintext, and verifies correctly
    - **Validates: Requirements 1.7**
    - **Property 2: Registration input validation** — For any invalid registration data, system rejects with field-specific errors
    - **Validates: Requirements 1.3**

  - [x] 2.3 Implement login, email verification, and password reset endpoints
    - Implement `POST /api/auth/login` with JWT token generation, failed attempt tracking, and account lockout after 3 consecutive failures for 15 minutes
    - Implement `POST /api/auth/verify-email` to verify token and set `emailVerified = true`
    - Implement `POST /api/auth/forgot-password` to generate reset token and send email
    - Implement `POST /api/auth/reset-password` to validate token and update password
    - Return generic "invalid credentials" on login failure (no user enumeration)
    - _Requirements: 1.4, 1.5, 1.6, 1.7_

  - [ ]* 2.4 Write property test for account lockout
    - **Property 3: Account lockout after failed login attempts** — After exactly 3 consecutive failed attempts, account is locked for 15 minutes; correct credentials rejected during lockout
    - **Validates: Requirements 1.5**

  - [x] 2.5 Implement JWT auth middleware
    - Create `server/src/middleware/auth.middleware.ts`
    - Validate JWT on protected routes, extract user ID and role
    - Return 401 with clear message on expired or invalid tokens
    - Create `requireAdmin` middleware that checks `role === ADMIN`
    - _Requirements: 1.4 (authentication gating)_

- [x] 3. Checkpoint — Auth module complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Assessment module
  - [x] 4.1 Implement assessment endpoints
    - Create `server/src/modules/assessment/assessment.routes.ts` and `assessment.service.ts`
    - Implement `POST /api/assessments/start` — create assessment session with sections for all 4 skill components
    - Implement `POST /api/assessments/:id/submit` — score answers, compute overall CEFR level and per-skill breakdown with strengths/improvements
    - Implement `PUT /api/users/:id/proficiency` — allow self-selecting a CEFR level (skip assessment)
    - Store results in AssessmentResult table
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 4.2 Write property tests for assessment
    - **Property 4: Assessment assigns valid CEFR level** — For any completed answers, assigned level is one of A1–C2
    - **Validates: Requirements 2.3**
    - **Property 5: Assessment result covers all skill components** — Result contains exactly 4 skill entries with valid CEFR level, strengths, and improvements
    - **Validates: Requirements 2.4, 2.5**

- [ ] 5. Curriculum management module
  - [x] 5.1 Implement curriculum CRUD endpoints
    - Create `server/src/modules/curriculum/curriculum.routes.ts` and `curriculum.service.ts`
    - Implement `GET /api/curriculum` with query filters for language, level, skill
    - Implement `POST /api/curriculum/lessons` (admin only) — create lesson with target language, level, skill, title, order, content
    - Implement `PUT /api/curriculum/lessons/:id` (admin only) — edit lesson
    - Implement `DELETE /api/curriculum/lessons/:id` (admin only) — remove lesson
    - Implement `PUT /api/curriculum/lessons/reorder` (admin only) — reorder lessons by array of IDs
    - Validate CEFR level and skill component values against allowed enums
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

  - [x] 5.2 Implement file upload endpoint with S3 storage
    - Implement `POST /api/curriculum/upload` (admin only, multipart via multer)
    - Validate file format: accept PDF, MP3, WAV, MP4, plain text; reject others with descriptive error
    - Upload accepted files to S3-compatible storage, return `{ fileUrl, fileType }`
    - Configure S3 client using `@aws-sdk/client-s3` with endpoint/credentials from env vars
    - _Requirements: 3.4, 3.5_

  - [ ]* 5.3 Write property tests for curriculum
    - **Property 6: Curriculum data invariant** — Any curriculum record has valid CEFR level and valid skill component
    - **Validates: Requirements 3.1, 3.2**
    - **Property 7: Curriculum upload requires classification** — Upload missing level or skill is rejected
    - **Validates: Requirements 3.3**
    - **Property 8: File format validation** — Unsupported MIME types/extensions are rejected with descriptive error
    - **Validates: Requirements 3.5**

- [ ] 6. Lesson engine module
  - [x] 6.1 Implement lesson retrieval and exercise submission endpoints
    - Create `server/src/modules/lessons/lessons.routes.ts` and `lessons.service.ts`
    - Implement `GET /api/lessons/:id` — return lesson detail with content blocks and exercises
    - Implement `POST /api/lessons/:id/exercises/:exerciseId/submit` — evaluate answer, return correctness, correct answer, and explanation
    - Implement `GET /api/lessons/:id/transcript` — return transcript text for listening lessons
    - Filter lessons by user's proficiency level for the relevant skill
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.2 Write property tests for lessons
    - **Property 9: Lessons match user proficiency level** — All returned lessons match user's assigned CEFR level
    - **Validates: Requirements 4.1, 5.1, 6.1, 7.1**
    - **Property 10: Lesson structure matches skill type** — Content/exercises match the lesson's skill type
    - **Validates: Requirements 4.2, 5.2, 6.2, 7.2**
    - **Property 11: Exercise submission feedback completeness** — Response includes correctness boolean, correct answer, and non-empty explanation
    - **Validates: Requirements 4.3, 5.4, 6.4, 7.3**
    - **Property 13: Listening lessons have transcripts** — Transcript endpoint returns non-empty text for listening lessons
    - **Validates: Requirements 6.3**

- [ ] 7. Speaking module
  - [x] 7.1 Implement speaking evaluation endpoint
    - Create `server/src/modules/speaking/speaking.routes.ts` and `speaking.service.ts`
    - Implement `POST /api/speaking/evaluate` — accept audio blob upload (multipart), compare against reference audio, return score (0–100), feedback, and reference audio URL
    - Validate audio blob presence and size (max 10MB)
    - Return graceful degradation message if pronunciation comparison is unavailable
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 7.2 Write property test for speaking exercises
    - **Property 14: Speaking exercises have reference audio** — `referenceAudioUrl` is non-null, non-empty for all speaking exercises
    - **Validates: Requirements 7.4**

- [x] 8. Checkpoint — Core backend modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Group learning and real-time chat module
  - [x] 9.1 Implement group session endpoints and Socket.IO events
    - Create `server/src/modules/groups/groups.routes.ts`, `groups.service.ts`, and `groups.socket.ts`
    - Implement `POST /api/groups/join` — find or create active session matching user's level and language, add participant, return session info
    - Implement Socket.IO events: `chat:send` (client→server), `chat:message` (server→client broadcast), `participant:joined`, `participant:left`
    - Persist chat messages to ChatMessage table
    - Handle WebSocket disconnections with automatic participant cleanup
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 9.2 Write property tests for group sessions
    - **Property 15: Group session level matching** — Session level matches joining user's proficiency level
    - **Validates: Requirements 8.3**
    - **Property 16: Group chat message delivery** — Messages are received by all other active participants with correct sender info and timestamp
    - **Validates: Requirements 8.4**

- [ ] 10. Progress tracking module
  - [x] 10.1 Implement progress and dashboard endpoints
    - Create `server/src/modules/progress/progress.routes.ts` and `progress.service.ts`
    - Implement `GET /api/progress/dashboard` — return current level, 4 skill entries with completed/total lessons and percent complete
    - Implement `GET /api/progress/history` — return paginated lesson completion history with scores and dates
    - Implement `POST /api/progress/complete` — upsert progress record (idempotent on userId+lessonId)
    - Trigger level-up notification when all lessons at current level for a skill are completed
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 4.4, 4.5, 5.5, 6.6, 7.5_

  - [ ]* 10.2 Write property tests for progress
    - **Property 12: Progress tracking round trip** — After submitting completion, querying progress returns matching score, completed=true, and non-null timestamp
    - **Validates: Requirements 4.4, 5.5, 6.6, 7.5**
    - **Property 17: Dashboard completeness** — Dashboard returns exactly 4 skill entries with valid CEFR level and percentage 0–100
    - **Validates: Requirements 9.1, 9.2**
    - **Property 18: Progress history contains required fields** — Each entry has lesson title, numeric score, and valid ISO timestamp
    - **Validates: Requirements 9.4**

- [ ] 11. Language management module
  - [x] 11.1 Implement language CRUD and user language switch
    - Create `server/src/modules/languages/languages.routes.ts` and `languages.service.ts`
    - Implement `GET /api/languages` — list all available languages
    - Implement `POST /api/languages` (admin only) — add new target language (no code changes required)
    - Implement `PUT /api/users/:id/target-language` — switch user's target language and reset dashboard context to new language
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 11.2 Write property tests for languages
    - **Property 19: Content-language association invariant** — All curriculum/lesson/assessment records reference a valid language code
    - **Validates: Requirements 10.1**
    - **Property 20: Adding a language makes it available** — New language appears in list and is selectable
    - **Validates: Requirements 10.3**
    - **Property 21: Language switch resets dashboard context** — After switch, dashboard shows only new language progress
    - **Validates: Requirements 10.5**

- [x] 12. Checkpoint — Full backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Frontend — Auth pages and routing
  - [x] 13.1 Set up React app shell with routing and auth context
    - Install React Router, Axios, and Socket.IO client in `client/`
    - Create `client/src/App.tsx` with route definitions for all pages
    - Create auth context (`AuthContext`) with JWT token storage (localStorage), login/logout functions, and protected route wrapper component
    - Create shared API client (`client/src/api/client.ts`) with Axios instance, base URL config, and JWT interceptor
    - Create shared `ApiError` type and error display component
    - _Requirements: 1.4 (access gating)_

  - [x] 13.2 Build registration, login, and password reset pages
    - Create `RegisterPage` with email, password, displayName fields, field-level validation errors, and success message about verification email
    - Create `LoginPage` with email/password fields, error display for invalid credentials and account lockout with remaining time
    - Create `ForgotPasswordPage` and `ResetPasswordPage` for password reset flow
    - Create `VerifyEmailPage` that reads token from URL and calls verify endpoint
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 14. Frontend — Assessment flow
  - [x] 14.1 Build assessment and self-select level pages
    - Create `AssessmentPage` that walks user through questions for all 4 skill components
    - Create `SelfSelectLevelPage` with CEFR level picker (A1–C2) as alternative to assessment
    - Create `AssessmentResultPage` showing assigned level with per-skill strengths and improvement areas
    - After assessment or self-select, redirect to learning dashboard
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 15. Frontend — Learning dashboard and progress
  - [x] 15.1 Build learning dashboard with progress visualization
    - Create `DashboardPage` as the main authenticated landing page
    - Display 4 skill component cards (Grammar, Reading, Listening, Speaking) with progress bars showing percent completion at current level
    - Display current CEFR level per skill
    - Display lesson history table with scores and completion dates
    - Add learning mode toggle (solo/group) that persists selection
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 8.1, 8.5_

- [ ] 16. Frontend — Lesson views for all skill components
  - [x] 16.1 Build grammar and reading lesson views
    - Create `LessonPage` wrapper that fetches lesson detail and renders skill-specific view
    - Create `GrammarLessonView` — display instructional content blocks, then interactive exercises (multiple-choice, fill-blank, matching) with immediate feedback and explanations
    - Create `ReadingLessonView` — display text passage with vocabulary highlights/definitions, then comprehension questions with feedback
    - Track and display completion status and score
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 16.2 Build listening and speaking lesson views
    - Create `ListeningLessonView` — audio player with unlimited replay, comprehension questions with feedback, reveal-transcript button
    - Create `SpeakingLessonView` — display prompt, play reference audio button, record audio using Web Speech API / MediaRecorder, submit recording, display pronunciation score and feedback, replay reference audio
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 17. Frontend — Group learning and chat
  - [x] 17.1 Build group session page with real-time chat
    - Create `GroupSessionPage` — join session via API, display shared lesson view, show participant list
    - Create `ChatPanel` component — Socket.IO connection, send/receive messages, display sender name and timestamp, auto-scroll
    - Handle participant join/leave events with UI updates
    - Handle WebSocket disconnection with reconnection attempt and user notification
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 18. Frontend — Admin panel
  - [x] 18.1 Build admin curriculum management and language management pages
    - Create `AdminPanel` layout with navigation (Curriculum, Languages)
    - Create `CurriculumEditorPage` — list curricula filtered by language/level/skill, create/edit/delete lessons, drag-and-drop reorder
    - Create `FileUploaderComponent` — file picker with format validation (PDF, MP3, WAV, MP4, text), upload progress indicator, error display for rejected formats
    - Create `LanguageManagerPage` — list languages, add new language form (code + name)
    - Gate admin pages behind `requireAdmin` role check in route guard
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 10.3_

- [ ] 19. Frontend — User profile
  - [x] 19.1 Build user profile and settings page
    - Create `ProfilePage` with display name, current CEFR level, target language selector
    - Add retake assessment button that navigates to assessment flow
    - Add target language switcher that calls language switch API and reloads dashboard
    - _Requirements: 2.6, 10.4, 10.5_

- [x] 20. Checkpoint — Frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Integration wiring and build configuration
  - [x] 21.1 Wire frontend build into backend for single-service deployment
    - Configure Vite build to output to `server/public/` (or `dist/client/`)
    - Add Express static file serving for the built React SPA with catch-all route for client-side routing
    - Add root `package.json` scripts: `build` (builds both client and server), `start` (runs compiled server), `dev` (runs both in development)
    - Verify API proxy works correctly in development (Vite proxy to Express)
    - _Requirements: Deployment architecture (single Railway service)_

  - [ ]* 21.2 Write integration tests for critical flows
    - Test full registration → login → assessment → lesson completion flow using Supertest
    - Test curriculum upload → lesson retrieval flow
    - Test group session join → chat message → receive flow using Socket.IO test client
    - _Requirements: 1.1–1.7, 2.1–2.6, 4.1–4.5, 8.3, 8.4_

- [ ] 22. Deployment to Railway via GitHub
  - [x] 22.1 Configure Railway deployment
    - Create `Procfile` or `railway.toml` with build and start commands
    - Add `Dockerfile` (optional, if Railway needs it) or configure Nixpacks build settings
    - Set up Railway PostgreSQL plugin and configure `DATABASE_URL` environment variable
    - Configure all required environment variables in Railway: `JWT_SECRET`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
    - Add Prisma migration step to build/start command (`prisma migrate deploy`)
    - Connect Railway project to GitHub repository for automatic deploys on push
    - _Requirements: Deployment architecture_

- [x] 23. Final checkpoint — Full application deployed
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after major milestones
- Property tests validate universal correctness properties from the design document
- The app deploys as a single Railway service (API + static SPA) with Railway PostgreSQL plugin
- Media files use external S3-compatible storage since Railway volumes are ephemeral
