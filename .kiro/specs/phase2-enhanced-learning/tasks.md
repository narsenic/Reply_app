# Implementation Plan: Phase 2 — Enhanced Learning Features

## Overview

Incremental implementation of Phase 2 features for the Reply Luxembourgish learning app. Tasks are ordered: schema changes first, then backend modules (chapters → quizzes → gamification → leaderboard → speaking → peers → admin), then frontend pages, then integration wiring. Each task builds on previous ones so there is no orphaned code.

## Tasks

- [x] 1. Database schema migration — add all Phase 2 models
  - [x] 1.1 Extend User model with `learningPath` and `totalXp` fields, add Lesson `chapterLessons` relation
    - Add `learningPath String?` and `totalXp Int @default(0)` to User model
    - Add all new relation fields to User (quizAttempts, chapterProgress, speakingAttempts, xpTransactions, streak, badges, peerParticipations, peerAvailability)
    - Add `chapterLessons ChapterLesson[]` relation to Lesson model
    - _Requirements: 2.2, 10.2_

  - [x] 1.2 Add Chapter, ChapterLesson, and ChapterProgress models
    - Create Chapter model with level, learningPath, orderIndex, published fields and `@@unique([level, learningPath, orderIndex])`
    - Create ChapterLesson join model with `@@unique([chapterId, lessonId])`
    - Create ChapterProgress model with per-skill percentages, allSectionsComplete, quizPassed, and `@@unique([userId, chapterId])`
    - _Requirements: 1.1, 1.4, 1.5, 1.6_

  - [x] 1.3 Add ChapterQuiz, QuizQuestion, and QuizAttempt models
    - Create ChapterQuiz with `chapterId @unique` and passingScore default 70
    - Create QuizQuestion with skill, type, prompt, options (Json), correctAnswer, explanation, audioUrl, referenceAudioUrl
    - Create QuizAttempt with score, passed, answers (Json)
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [x] 1.4 Add SpeakingPrompt, ShadowingExercise, and SpeakingAttempt models
    - Create SpeakingPrompt with topic, suggestedVocabulary, guidingQuestions (Json), difficulty, learningPath
    - Create ShadowingExercise with nativeAudioUrl, transcript, orderIndex
    - Create SpeakingAttempt with exerciseType, recordingUrl, self-eval score fields, playbackSpeed
    - _Requirements: 5.2, 5.5, 5.6, 6.1, 6.6, 8.1_

  - [x] 1.5 Add XPTransaction, Streak, Badge, and UserBadge models
    - Create XPTransaction with amount, activityType, description
    - Create Streak with currentStreak, longestStreak, lastActivityDate, `userId @unique`
    - Create Badge with key (unique), name, description, iconUrl, criteria
    - Create UserBadge with `@@unique([userId, badgeId])`
    - _Requirements: 10.1, 10.4, 11.1, 11.4, 12.1_

  - [x] 1.6 Add PeerSession, PeerSessionParticipant, and PeerAvailability models
    - Create PeerSession with promptId, status, startedAt, endedAt
    - Create PeerSessionParticipant with role, `@@unique([sessionId, userId])`
    - Create PeerAvailability with status, `userId @unique`
    - _Requirements: 7.1, 7.3, 7.6, 15.1_

  - [x] 1.7 Run Prisma migration and verify schema
    - Run `npx prisma migrate dev --name phase2-enhanced-learning`
    - Verify all models are created and relations are correct
    - _Requirements: 1.1, 2.2, 4.1, 5.2, 7.1, 10.1, 11.1, 12.1_

- [x] 2. Seed badge definitions
  - [x] 2.1 Create badge seed data and update seed script
    - Add badge definitions to `server/prisma/seed.ts`: first_chapter, first_quiz, xp_500, xp_1000, level_complete, streak_7, streak_30, streak_100
    - Use upsert on badge key to make seeding idempotent
    - _Requirements: 12.1, 12.4_

- [x] 3. Chapters module — backend
  - [x] 3.1 Create chapters service (`server/src/modules/chapters/chapters.service.ts`)
    - Implement `listChapters(userId, level, learningPath)` — return chapters with status (locked/in_progress/completed) based on sequential unlock logic
    - Implement `getChapterDetail(userId, chapterId)` — return skill sections with lessons, speaking prompts, shadowing exercises, quiz unlock status
    - Implement `createChapter(data)` (admin), `updateChapter(id, data)` (admin), `deleteChapter(id)` (admin)
    - Implement `updateChapterProgress(userId, chapterId, skill)` — recalculate skill percentage and allSectionsComplete flag
    - Server enforces chapter locking: chapter N+1 locked until chapter N quiz passed
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.3, 2.4_

  - [x] 3.2 Create chapters routes (`server/src/modules/chapters/chapters.routes.ts`)
    - GET `/api/chapters?level=&path=` — list chapters for user with status
    - GET `/api/chapters/:id` — chapter detail with skill sections
    - POST `/api/chapters` (admin) — create chapter
    - PUT `/api/chapters/:id` (admin) — update chapter
    - DELETE `/api/chapters/:id` (admin) — delete chapter
    - Add Zod validation schemas for all request bodies and query params
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.3 Register chapters routes in server index
    - Import and mount chapters routes at `/api/chapters` in `server/src/index.ts`
    - _Requirements: 1.1_

  - [ ]* 3.4 Write property tests for chapters (Properties 1–6, 8–9)
    - **Property 1: Chapter structure invariant** — chapter detail has exactly 4 skill sections
    - **Property 2: Chapter sequential ordering** — chapters sorted by orderIndex, no duplicates
    - **Property 3: Skill completion independence** — updating one skill doesn't change others
    - **Property 4: Chapter completion derived from skill completion** — allSectionsComplete iff all skills at 100%
    - **Property 5: Chapter progress percentages are bounded** — each skill 0–100
    - **Property 6: Chapter sequential locking** — if chapter N not quiz-passed, N+1 is locked
    - **Property 8: Chapters filtered by learning path** — all returned chapters match user's path
    - **Property 9: Learning path switch preserves previous progress** — old progress unchanged after switch
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.3, 2.4, 2.6**

  - [ ]* 3.5 Write unit tests for chapters service
    - Test chapter listing with locked/in_progress/completed statuses
    - Test chapter detail returns correct skill sections and lesson counts
    - Test chapter progress update recalculates correctly
    - Test admin CRUD operations
    - Test 403 when accessing locked chapter
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7_

- [x] 4. Learning path selection — backend
  - [x] 4.1 Add learning path endpoints to auth/user module
    - Add PUT `/api/users/learning-path` endpoint to set/switch learning path
    - Validate learning path is 'sproochentest' or 'daily_life'
    - Preserve progress on path switch (no deletion of ChapterProgress records)
    - Return updated user profile with learning path
    - _Requirements: 2.1, 2.2, 2.5, 2.6_

  - [ ]* 4.2 Write property test for learning path (Property 7)
    - **Property 7: Learning path storage round trip** — store and read back returns same value
    - **Validates: Requirements 2.2**

- [x] 5. Chapter quizzes module — backend
  - [x] 5.1 Create quizzes service (`server/src/modules/quizzes/quizzes.service.ts`)
    - Implement `getQuiz(userId, chapterId)` — return quiz questions; enforce unlock check (allSectionsComplete must be true)
    - Implement `submitQuiz(userId, chapterId, answers)` — calculate score as `round((correct/total)*100)`, determine pass/fail at 70%, store QuizAttempt, track highest score
    - Implement `getQuizHistory(userId, chapterId)` — return all attempts with highest score
    - On quiz pass: mark ChapterProgress.quizPassed = true, unlock next chapter
    - On quiz fail: return incorrect answers with explanations
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 5.2 Create quizzes routes (`server/src/modules/quizzes/quizzes.routes.ts`)
    - GET `/api/chapters/:chapterId/quiz` — get quiz questions
    - POST `/api/chapters/:chapterId/quiz/submit` — submit answers
    - GET `/api/chapters/:chapterId/quiz/results` — get attempt history
    - Add Zod validation for quiz submission
    - Register routes in server index
    - _Requirements: 4.1, 4.3, 4.6_

  - [ ]* 5.3 Write property tests for quizzes (Properties 12–17)
    - **Property 12: Quiz unlock requires all sections complete**
    - **Property 13: Quiz covers all four skill components**
    - **Property 14: Quiz score calculation** — `round((correct/total)*100)`
    - **Property 15: Quiz pass threshold** — passed iff score >= 70
    - **Property 16: Quiz highest score tracking**
    - **Property 17: Quiz result skill breakdown** — one entry per skill, correct <= total
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**

  - [ ]* 5.4 Write unit tests for quizzes service
    - Test quiz unlock logic (403 when sections incomplete)
    - Test score calculation with known answer sets
    - Test pass/fail at exactly 70% boundary
    - Test retake tracking and highest score update
    - Test skill breakdown calculation
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 6. Checkpoint — Ensure schema, chapters, and quizzes work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Gamification module — backend (XP, Streaks, Badges)
  - [x] 7.1 Create gamification service (`server/src/modules/gamification/gamification.service.ts`)
    - Implement `awardXP(userId, activityType)` — award 10 (lesson), 25 (quiz_pass), 50 (chapter_completion); create XPTransaction; update User.totalXp; idempotent for duplicate completions
    - Implement `updateStreak(userId)` — increment streak if first activity today (UTC), reset if missed day, update longestStreak
    - Implement `checkAndAwardBadges(userId)` — check all milestone conditions (first chapter, first quiz, 500 XP, 1000 XP, level complete, streak 7/30/100); award via upsert
    - Implement `getSummary(userId)` — return totalXp, currentStreak, longestStreak, badges, recent XP gains
    - Implement `getXPHistory(userId, page, limit)` — paginated XP transaction log
    - Implement `getBadges(userId)` — return earned and locked badges
    - Implement `getStreak(userId)` — return current/longest streak and lastActivityDate
    - _Requirements: 10.1, 10.2, 10.4, 11.1, 11.2, 11.4, 11.5, 12.1, 12.3, 12.4_

  - [x] 7.2 Create gamification routes (`server/src/modules/gamification/gamification.routes.ts`)
    - GET `/api/gamification/summary` — gamification summary
    - GET `/api/gamification/xp/history?page=&limit=` — XP history
    - GET `/api/gamification/badges` — earned and locked badges
    - GET `/api/gamification/streak` — streak info
    - Register routes in server index
    - _Requirements: 10.2, 10.4, 11.3, 12.3, 12.4_

  - [x] 7.3 Integrate XP/streak/badge awards into existing completion flows
    - Hook `awardXP` into lesson completion in progress service (10 XP)
    - Hook `awardXP` into quiz pass in quizzes service (25 XP)
    - Hook `awardXP` into chapter completion in chapters service (50 XP)
    - Call `updateStreak` on each activity completion
    - Call `checkAndAwardBadges` after XP award and streak update
    - Return xpGained and newBadges in completion responses
    - _Requirements: 10.1, 10.3, 11.1, 12.2_

  - [ ]* 7.4 Write property tests for gamification (Properties 28–38)
    - **Property 28: XP award amounts by activity type** — 10/25/50 for lesson/quiz/chapter
    - **Property 29: Total XP equals sum of transactions**
    - **Property 30: XP transaction required fields** — valid activityType, positive amount, valid timestamp
    - **Property 31: Streak increment on daily activity** — +1 on first activity of new day
    - **Property 32: Streak reset on missed day** — currentStreak = 0 if missed day
    - **Property 33: Longest streak invariant** — longestStreak >= currentStreak
    - **Property 34: Streak milestone badges** — badge awarded at 7, 30, 100
    - **Property 35: Badge milestone awarding** — each milestone badge awarded exactly once
    - **Property 36: Badge list completeness** — earned + locked = all badges
    - **Property 37: Dashboard summary completeness** — includes level, XP, streak, badges
    - **Property 38: Chapter status consistency** — status matches progress data
    - **Validates: Requirements 10.1, 10.2, 10.4, 11.1, 11.2, 11.4, 11.5, 12.1, 12.3, 12.4, 13.3**

  - [ ]* 7.5 Write unit tests for gamification service
    - Test XP award for each activity type (10/25/50)
    - Test duplicate completion idempotency
    - Test streak increment, reset, and longest streak tracking
    - Test badge awarding for each milestone
    - Test badge not re-awarded
    - Test summary includes all required fields
    - _Requirements: 10.1, 10.4, 11.1, 11.2, 11.4, 12.1_

- [x] 8. Leaderboard module — backend
  - [x] 8.1 Create leaderboard service (`server/src/modules/leaderboard/leaderboard.service.ts`)
    - Implement `getLeaderboard(userId, period, limit)` — query XP aggregates by period (weekly/monthly/all_time), sort descending, limit to 50, include user's own rank
    - Weekly: XP from current calendar week (Monday–Sunday UTC)
    - Monthly: XP from current calendar month UTC
    - All-time: User.totalXp
    - Each entry includes displayName, totalXp, currentStreak, badgeCount
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [x] 8.2 Create leaderboard routes (`server/src/modules/leaderboard/leaderboard.routes.ts`)
    - GET `/api/leaderboard?period=weekly|monthly|all_time&limit=50`
    - Add Zod validation for period and limit params
    - Register routes in server index
    - _Requirements: 14.1, 14.2_

  - [ ]* 8.3 Write property tests for leaderboard (Properties 39–43)
    - **Property 39: Leaderboard sorted by XP descending**
    - **Property 40: Leaderboard period filtering** — correct period in response
    - **Property 41: Leaderboard includes user rank** — userRank present with rank and XP
    - **Property 42: Leaderboard entry limit** — at most 50 entries
    - **Property 43: Leaderboard entry required fields** — displayName, totalXp, currentStreak, badgeCount all present and valid
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.6**

  - [ ]* 8.4 Write unit tests for leaderboard service
    - Test sorting by XP descending
    - Test weekly/monthly/all-time period filtering
    - Test user rank calculation
    - Test 50-entry limit
    - Test entry field completeness
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.6_

- [x] 9. Checkpoint — Ensure gamification and leaderboard work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Enhanced speaking module — backend
  - [x] 10.1 Extend speaking service with record-and-compare and self-evaluation
    - Implement `recordAttempt(userId, exerciseId, audioFile)` — upload audio to S3, create SpeakingAttempt, return recordingUrl and referenceAudioUrl
    - Implement `selfEvaluate(attemptId, scores)` — validate scores 1–5 for each criterion, update SpeakingAttempt
    - Implement `getShadowingExercise(exerciseId)` — return native audio, transcript, available speeds [0.5, 0.75, 1.0, 1.25]
    - Implement `recordShadowingAttempt(userId, exerciseId, audioFile, playbackSpeed)` — validate speed, upload audio, create SpeakingAttempt with exerciseType 'shadowing'
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 10.2 Add enhanced speaking routes
    - POST `/api/speaking/record` (multipart) — record speaking attempt
    - POST `/api/speaking/self-evaluate` — submit self-evaluation
    - GET `/api/speaking/shadowing/:exerciseId` — get shadowing exercise
    - POST `/api/speaking/shadowing/:exerciseId/attempt` (multipart) — record shadowing attempt
    - Add Zod validation for self-eval scores (1–5) and playback speed
    - _Requirements: 5.1, 5.2, 5.5, 6.1, 6.2, 6.4_

  - [ ]* 10.3 Write property tests for speaking (Properties 18–20)
    - **Property 18: Speaking attempt storage round trip** — upload creates record with valid URL and correct exerciseId
    - **Property 19: Self-evaluation score validation** — scores must be integers 1–5, reject out-of-range
    - **Property 20: Shadowing exercise playback speeds** — available speeds exactly [0.5, 0.75, 1.0, 1.25]
    - **Validates: Requirements 5.2, 5.5, 5.6, 6.4, 6.5, 6.6**

  - [ ]* 10.4 Write unit tests for enhanced speaking service
    - Test audio upload creates SpeakingAttempt with correct fields
    - Test self-evaluation rejects scores outside 1–5
    - Test shadowing exercise returns correct playback speeds
    - Test shadowing attempt tracks attempt number
    - _Requirements: 5.2, 5.5, 6.4, 6.6_

- [x] 11. Speaking prompts — backend
  - [x] 11.1 Add speaking prompts CRUD and retrieval
    - Implement `getPromptsByChapter(chapterId)` — return prompts with topic, vocabulary, guiding questions
    - Implement `createPrompt(data)` (admin) — validate required fields (topic, suggestedVocabulary, guidingQuestions non-empty, difficulty in easy/medium/hard)
    - Prompts categorized by difficulty within each level
    - Sproochentest prompts match exam topic format; Daily Life prompts cover everyday scenarios
    - Add routes: GET `/api/chapters/:chapterId/prompts`, POST `/api/chapters/:chapterId/prompts` (admin)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 11.2 Write property test for speaking prompts (Property 25)
    - **Property 25: Speaking prompt required fields** — non-empty topic, vocabulary, guidingQuestions array, valid difficulty
    - **Validates: Requirements 8.2, 8.3**

- [x] 12. Sproochentest exam preparation — backend
  - [x] 12.1 Add Sproochentest-specific exercise types and mock exams
    - Implement oral production exercises: present topic card + picture, allow recording with 10-minute time limit
    - Implement listening comprehension exercises: play audio passage, present comprehension questions
    - Implement timed practice sessions with exam-equivalent time constraints
    - Implement mock exam endpoint that combines oral production + listening comprehension sections
    - Implement mock exam scoring with section breakdown and feedback
    - Implement topic card library organized by proficiency level
    - Add routes for mock exams and timed practice under `/api/sproochentest/`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 12.2 Write property tests for Sproochentest (Properties 10–11)
    - **Property 10: Sproochentest exercises include required formats** — at least one oral production and one listening comprehension per chapter
    - **Property 11: Mock exam score breakdown completeness** — exactly 2 sections with numeric scores and feedback
    - **Validates: Requirements 3.1, 3.6**

- [x] 13. Checkpoint — Ensure speaking, prompts, and Sproochentest work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Peer matching and WebRTC signaling — backend
  - [x] 14.1 Create peer matching service (`server/src/modules/peers/peers.service.ts`)
    - Implement `getAvailablePeers(userId, level)` — return available users at same proficiency level
    - Implement `setAvailability(userId, status)` — validate status is 'available'|'busy'|'offline'
    - Implement `sendInvitation(userId, targetUserId)` — create invitation with 2-minute expiry, validate target is available
    - Implement `acceptInvitation(userId, invitationId)` — create PeerSession with status 'active', 2 participants, assign speaking prompt, set both users to 'busy'
    - Implement `endSession(userId, sessionId)` — set session status to 'completed', prompt self-evaluation
    - Implement invitation expiry: cancel after 2 minutes if not accepted
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7, 7.8, 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 14.2 Create peer routes and WebRTC signaling socket handlers
    - GET `/api/peers/available?level=` — list available peers
    - PUT `/api/peers/availability` — set availability status
    - POST `/api/peers/invite` — send invitation
    - POST `/api/peers/invite/:invitationId/accept` — accept invitation
    - POST `/api/peers/sessions/:sessionId/end` — end session
    - Add Socket.IO handlers for WebRTC signaling: `peer:signal` (offer/answer/ice-candidate relay), `peer:invitation`, `peer:session-started`, `peer:session-ended`
    - Register routes and socket handlers in server index
    - _Requirements: 7.1, 7.3, 7.4, 15.2, 15.3_

  - [ ]* 14.3 Write property tests for peers (Properties 21–24, 44–45)
    - **Property 21: Peer availability filtering by level** — all returned peers match level and are 'available'
    - **Property 22: Peer session creation on acceptance** — session has status 'active', 2 participants, non-null prompt
    - **Property 23: Peer availability status validation** — only 'available'|'busy'|'offline' accepted
    - **Property 24: Active peer session sets busy status** — participants in active session have 'busy' availability
    - **Property 44: Peer invitation creates with expiry** — expiresAt is 2 minutes from now
    - **Property 45: Available peer count matches list** — totalAvailable equals peers array length
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5, 7.6, 15.1, 15.2, 15.3, 15.5, 15.6**

  - [ ]* 14.4 Write unit tests for peer matching service
    - Test available peers filtered by level and status
    - Test invitation creation with 2-minute expiry
    - Test invitation expiry after timeout
    - Test session creation on acceptance with 2 participants
    - Test availability set to busy on active session
    - Test 409 when inviting non-available peer
    - _Requirements: 7.1, 7.2, 7.3, 7.6, 7.8, 15.1, 15.5_

- [ ] 15. Admin material upload — backend
  - [ ] 15.1 Extend curriculum module with chapter material upload
    - Implement `uploadMaterials(chapterId, skill, files)` — validate file formats (PDF, MP3, WAV, text), upload to S3, create ContentBlock records linked to chapter
    - Implement `reorderMaterials(chapterId, contentBlockIds)` — reorder content blocks
    - Implement `deleteMaterial(chapterId, contentBlockId)` — remove content block and S3 file
    - Implement `previewMaterials(chapterId)` — return all materials for admin preview
    - Implement `publishChapter(chapterId)` — set chapter.published = true
    - Reject unsupported file formats with 415 and descriptive error
    - Require level, chapter, and skill classification on upload
    - Add routes: POST `/api/curriculum/chapters/:chapterId/upload`, PUT `.../materials/reorder`, DELETE `.../materials/:id`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 15.2 Write property tests for admin upload (Properties 25–27)
    - **Property 25: Speaking prompt required fields** (already covered in 11.2, skip if done)
    - **Property 26: Admin upload requires classification** — reject if missing level, chapterId, or skill
    - **Property 27: File format validation for uploads** — reject unsupported MIME types with error
    - **Validates: Requirements 9.2, 9.3, 9.5**

  - [ ]* 15.3 Write unit tests for admin upload
    - Test file format validation (accept PDF, MP3, WAV, text; reject others)
    - Test required classification fields validation
    - Test material reordering
    - Test material deletion
    - Test 415 error for unsupported formats
    - _Requirements: 9.2, 9.3, 9.5, 9.6_

- [x] 16. Checkpoint — Ensure all backend modules work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Frontend — Learning path selection page
  - [x] 17.1 Create PathSelectionPage component
    - Display two cards: Sproochentest Preparation and Daily Life Luxembourgish
    - On selection, call PUT `/api/users/learning-path`
    - Navigate to dashboard after selection
    - Show after onboarding/assessment if no learning path set
    - _Requirements: 2.1, 2.2_

  - [x] 17.2 Add learning path switch to ProfilePage
    - Add learning path selector in profile settings
    - Call PUT `/api/users/learning-path` on change
    - Show confirmation that progress is preserved
    - _Requirements: 2.5, 2.6_

- [x] 18. Frontend — Chapter map page
  - [x] 18.1 Create ChapterMapPage component
    - Display all chapters for current level and learning path as a visual map
    - Each chapter card shows: title, progress rings for 4 skills, completion status (locked/in_progress/completed)
    - Locked chapters shown with lock icon, not clickable
    - Completed chapters shown with checkmark
    - Click on unlocked chapter navigates to chapter detail
    - _Requirements: 1.2, 1.7, 13.1, 13.2_

  - [x] 18.2 Create ChapterDetailPage component
    - Display four skill sections (Grammar, Reading, Listening, Speaking) with lesson lists
    - Show completion count per skill section
    - Show speaking prompts and shadowing exercises within speaking section
    - Show quiz button (locked until all sections complete, unlocked when ready)
    - Show chapter progress overview with percentage per skill
    - _Requirements: 1.3, 1.4, 1.6, 4.1_

- [x] 19. Frontend — Chapter quiz page
  - [x] 19.1 Create ChapterQuizPage component
    - Fetch quiz questions from GET `/api/chapters/:chapterId/quiz`
    - Render questions by type: multiple-choice, fill-blank, listening-comprehension, speaking-prompt
    - Submit answers via POST `/api/chapters/:chapterId/quiz/submit`
    - Display results: score percentage, pass/fail, skill breakdown, incorrect answers with explanations
    - Show retake button on failure
    - Display completion animation and XP/badge notifications on pass
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7, 10.3, 13.4_

- [x] 20. Frontend — Enhanced speaking components
  - [x] 20.1 Create RecordAndCompare widget
    - Play reference audio button
    - Record button using MediaRecorder API
    - Playback of user recording alongside reference audio
    - Re-record button (unlimited attempts)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 20.2 Create SelfEvaluationRubric component
    - Display 4 criteria: pronunciation, fluency, vocabulary, grammar accuracy
    - 1–5 scale selector for each criterion
    - Submit self-evaluation via POST `/api/speaking/self-evaluate`
    - _Requirements: 5.5, 5.6_

  - [x] 20.3 Create ShadowingExerciseView component
    - Play native audio with speed selector (0.5x, 0.75x, 1.0x, 1.25x)
    - Record user attempt
    - Sequential playback: native audio then user recording
    - Show self-evaluation rubric after recording
    - Display attempt count
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 21. Frontend — Peer practice page
  - [x] 21.1 Create PeerPracticePage component
    - Display list of available peers at same level with count
    - Availability status toggle (available/busy/offline)
    - Send invitation button per peer
    - Incoming invitation notification with accept/decline
    - 2-minute timeout display for pending invitations
    - _Requirements: 7.1, 7.2, 7.5, 7.6, 7.8, 15.1, 15.2, 15.6_

  - [ ] 21.2 Create PeerCallView component with WebRTC audio
    - Establish WebRTC peer connection using Socket.IO signaling
    - Display shared speaking prompt during call
    - End call button
    - Show self-evaluation rubric after call ends
    - Handle connection failures gracefully
    - _Requirements: 7.3, 7.4, 7.7, 15.3_

- [x] 22. Frontend — Gamification UI components
  - [x] 22.1 Create XP and streak display components
    - XPDisplay: show total XP on dashboard
    - StreakCounter: show current streak with flame icon
    - XPGainNotification: toast notification on XP earn
    - _Requirements: 10.2, 10.3, 11.3_

  - [x] 22.2 Create BadgeShelf component
    - Display earned badges with icons and earnedAt dates on profile page
    - Display locked badges with unlock criteria
    - Badge earn notification popup
    - _Requirements: 12.2, 12.3, 12.4_

  - [x] 22.3 Update DashboardPage with gamification summary
    - Fetch GET `/api/gamification/summary`
    - Display total XP, current streak, badge count
    - Display chapter map link for current level
    - Show completion animation on chapter complete
    - _Requirements: 13.3, 13.4_

- [x] 23. Frontend — Leaderboard page
  - [x] 23.1 Create LeaderboardPage component
    - Fetch GET `/api/leaderboard?period=&limit=50`
    - Tab selector for weekly/monthly/all-time views
    - Display ranked list: rank, displayName, totalXp, currentStreak, badgeCount
    - Highlight current user's row
    - Show user's own rank if outside top 50
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.6_

- [ ] 24. Frontend — Admin panel extensions
  - [ ] 24.1 Extend AdminPanel with chapter management and material upload
    - Chapter CRUD: create, edit, delete, reorder chapters
    - Material upload form: select level, chapter, skill; drag-and-drop file upload
    - File format validation on client side (PDF, MP3, WAV, text)
    - Material preview, reorder, and delete within chapter
    - Publish chapter button
    - Quiz management: add/edit/delete quiz questions per chapter
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 25. Frontend — Sproochentest exam pages
  - [x] 25.1 Create SproochentestPracticePage component
    - Oral production exercise: display topic card + picture, record with 10-minute timer
    - Listening comprehension exercise: play audio, answer questions
    - Timed practice mode with countdown timer
    - Mock exam flow: oral production section → listening comprehension section
    - Results page: score breakdown by section with feedback
    - Topic card library browser by level
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 26. Frontend routing — wire all new pages into App.tsx
  - [x] 26.1 Add routes for all new pages
    - `/path-selection` — PathSelectionPage (semi-public, after onboarding)
    - `/chapters` — ChapterMapPage (protected)
    - `/chapters/:id` — ChapterDetailPage (protected)
    - `/chapters/:id/quiz` — ChapterQuizPage (protected)
    - `/speaking/peer` — PeerPracticePage (protected)
    - `/leaderboard` — LeaderboardPage (protected)
    - `/sproochentest` — SproochentestPracticePage (protected)
    - Update DashboardPage navigation links to new pages
    - Update existing LessonPage to integrate with chapter progress tracking
    - _Requirements: 1.1, 2.1, 4.1, 7.1, 13.1, 14.1_

- [ ] 27. Checkpoint — Ensure all frontend pages render and connect to backend
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 28. Integration — wire lesson completion to chapter progress
  - [ ] 28.1 Update progress service to update chapter progress on lesson completion
    - When a lesson is completed, look up its ChapterLesson association
    - Recalculate the skill percentage for that chapter and skill
    - Update ChapterProgress record
    - Check if allSectionsComplete should be set to true
    - Trigger XP award (10 XP for lesson completion)
    - _Requirements: 1.4, 1.5, 10.1_

  - [ ] 28.2 Update client API types for Phase 2 responses
    - Add TypeScript interfaces in `client/src/types/api.ts` for all Phase 2 API responses
    - Add API client methods in `client/src/api/client.ts` for all Phase 2 endpoints
    - _Requirements: 1.1, 4.1, 7.1, 10.1, 14.1_

- [ ] 29. Final checkpoint — Ensure all tests pass and features are integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each major feature group
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The existing tech stack (React, Express, Prisma, Socket.IO, S3) is extended — no new frameworks introduced
- WebRTC peer audio uses Socket.IO for signaling (already in the project)
- All XP/streak/badge logic is server-side to prevent client manipulation
