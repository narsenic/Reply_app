# Requirements Document

## Introduction

Phase 2 enhancement of the Reply Luxembourgish learning app. This expansion restructures the existing skill-based curriculum into a chapter-based learning system that mirrors a real classroom experience. It introduces two distinct learning paths (Sproochentest Preparation and Daily Life Luxembourgish), chapter quizzes, enhanced speaking practice without speech-to-text, peer-to-peer student matching, gamification with XP/streaks/badges, a public leaderboard, and admin material upload tools. These features aim to surpass what LLO.LU (Luxembourg's government self-study platform) offers by adding a teacher-like experience, structured exam preparation, social learning, and motivation mechanics.

## Glossary

- **App**: The Reply Luxembourgish language learning application
- **User**: A registered person using the App to learn Luxembourgish
- **Admin**: A privileged user who manages curriculum content and system configuration
- **Chapter**: A bundled unit of learning that combines all four Skill_Components (Grammar, Reading, Listening, Speaking) around a single topic, modeled after a textbook chapter
- **Skill_Component**: One of the four learning areas: Grammar, Reading, Listening, or Speaking
- **Learning_Path**: The chosen study track: either Sproochentest_Preparation or Daily_Life
- **Sproochentest**: Luxembourg's official citizenship language exam requiring A2 speaking proficiency and B1 listening comprehension
- **Sproochentest_Preparation**: A Learning_Path focused on preparing Users for the Sproochentest exam format, including mock tests, timed practice, and topic cards
- **Daily_Life**: A Learning_Path focused on conversational Luxembourgish for everyday situations
- **Chapter_Quiz**: An end-of-chapter evaluation that tests all four Skill_Components covered in the Chapter
- **Shadowing_Exercise**: A speaking practice where the User listens to native audio, repeats it, records the attempt, and self-evaluates using a rubric
- **Speaking_Prompt**: A guided conversation topic or scenario presented to the User for speaking practice
- **Peer_Session**: A speaking practice session between two or more Users at the same proficiency level
- **XP**: Experience points earned by completing lessons, quizzes, and chapters
- **Streak**: A count of consecutive days a User has completed at least one learning activity
- **Badge**: A visual reward earned for reaching specific milestones
- **Leaderboard**: A ranked list of Users ordered by XP earned
- **Material_Upload**: The process by which an Admin uploads book chapters (PDFs, audio, text) organized by level and chapter
- **CEFR**: Common European Framework of Reference for Languages (levels A1–C2)
- **Proficiency_Level**: The User's assessed CEFR level
- **Reference_Audio**: A native speaker recording used as the pronunciation standard for speaking exercises
- **Self_Evaluation_Rubric**: A structured checklist that guides Users in assessing their own speaking performance across criteria such as pronunciation, fluency, and vocabulary usage

## Requirements

### Requirement 1: Chapter-Based Curriculum Structure

**User Story:** As a User, I want lessons organized into chapters that bundle all four skills around a single topic, so that I experience a structured classroom-like progression through the material.

#### Acceptance Criteria

1. THE App SHALL organize all learning content into Chapters, where each Chapter bundles Grammar, Reading, Listening, and Speaking lessons around a single topic
2. THE App SHALL present Chapters in a sequential order within each Proficiency_Level
3. WHEN a User opens a Chapter, THE App SHALL display the four Skill_Component sections (Grammar, Reading, Listening, Speaking) available within that Chapter
4. THE App SHALL track completion status for each Skill_Component within a Chapter independently
5. WHEN a User completes all four Skill_Component sections within a Chapter, THE App SHALL mark the Chapter as complete
6. THE App SHALL display a Chapter progress overview showing completion percentage for each Skill_Component within the Chapter
7. WHILE a User has not completed the current Chapter, THE App SHALL restrict access to subsequent Chapters within the same Proficiency_Level

### Requirement 2: Learning Path Selection

**User Story:** As a User, I want to choose between Sproochentest preparation and daily life Luxembourgish tracks, so that I study content aligned with my personal learning goal.

#### Acceptance Criteria

1. WHEN a User completes onboarding, THE App SHALL prompt the User to select a Learning_Path: Sproochentest_Preparation or Daily_Life
2. THE App SHALL store the selected Learning_Path in the User profile
3. WHEN a User selects the Sproochentest_Preparation Learning_Path, THE App SHALL present Chapters tailored to Sproochentest exam content and format
4. WHEN a User selects the Daily_Life Learning_Path, THE App SHALL present Chapters focused on conversational Luxembourgish for everyday situations
5. THE App SHALL allow a User to switch Learning_Path from the profile settings at any time
6. WHEN a User switches Learning_Path, THE App SHALL preserve the User's progress in the previous Learning_Path and display progress for the newly selected Learning_Path

### Requirement 3: Sproochentest Exam Preparation

**User Story:** As a User preparing for the Sproochentest, I want exam-format exercises, timed practice, and mock tests, so that I am prepared for the actual exam conditions.

#### Acceptance Criteria

1. THE Sproochentest_Preparation Learning_Path SHALL include exercises that match the Sproochentest exam format: oral production (discuss a topic and describe a picture) and listening comprehension
2. WHEN a User starts an oral production exercise, THE App SHALL present a topic card and a picture, then allow the User to record a spoken response within a 10-minute time limit
3. WHEN a User starts a listening comprehension exercise, THE App SHALL play an audio passage and present comprehension questions matching the Sproochentest format
4. THE Sproochentest_Preparation Learning_Path SHALL include timed practice sessions where the App enforces exam-equivalent time constraints
5. THE App SHALL provide mock Sproochentest exams that simulate the full exam experience including both oral production and listening comprehension sections
6. WHEN a User completes a mock Sproochentest exam, THE App SHALL display a score breakdown by section (oral production and listening comprehension) with feedback on areas for improvement
7. THE App SHALL provide a library of topic cards covering common Sproochentest discussion subjects, organized by Proficiency_Level

### Requirement 4: Chapter Quizzes

**User Story:** As a User, I want to take a quiz at the end of each chapter that tests all four skills, so that I can verify my understanding before moving on.

#### Acceptance Criteria

1. WHEN a User completes all four Skill_Component sections within a Chapter, THE App SHALL unlock the Chapter_Quiz for that Chapter
2. THE Chapter_Quiz SHALL include questions covering all four Skill_Components: Grammar, Reading, Listening, and Speaking
3. WHEN a User submits a Chapter_Quiz, THE App SHALL calculate and display a score as a percentage
4. WHEN a User scores 70% or higher on a Chapter_Quiz, THE App SHALL mark the Chapter_Quiz as passed and unlock the next Chapter
5. WHEN a User scores below 70% on a Chapter_Quiz, THE App SHALL display the incorrect answers with explanations and allow the User to retake the Chapter_Quiz
6. THE App SHALL store the highest Chapter_Quiz score and the number of attempts for each User and Chapter combination
7. THE App SHALL display Chapter_Quiz results with a breakdown by Skill_Component so the User can identify weak areas

### Requirement 5: Enhanced Speaking Practice (Record and Compare)

**User Story:** As a User, I want to record my speech and compare it with native audio, so that I can improve my pronunciation without relying on speech-to-text technology.

#### Acceptance Criteria

1. WHEN a User opens a speaking exercise, THE App SHALL display a Speaking_Prompt and provide a button to play the Reference_Audio
2. WHEN a User presses the record button, THE App SHALL capture audio from the User's microphone and store the recording
3. WHEN a User finishes recording, THE App SHALL allow the User to play back the recording alongside the Reference_Audio for comparison
4. THE App SHALL allow the User to re-record a speaking exercise without limit
5. THE App SHALL present a Self_Evaluation_Rubric with criteria (pronunciation, fluency, vocabulary usage, grammar accuracy) after each recording, allowing the User to rate their own performance on a scale of 1 to 5 for each criterion
6. THE App SHALL store the User's self-evaluation scores for each speaking exercise attempt

### Requirement 6: Shadowing Exercises

**User Story:** As a User, I want to practice shadowing native speakers by listening and repeating, so that I can develop natural speech patterns and rhythm.

#### Acceptance Criteria

1. THE App SHALL provide Shadowing_Exercises within the Speaking Skill_Component of each Chapter
2. WHEN a User starts a Shadowing_Exercise, THE App SHALL play a native audio segment, then prompt the User to repeat the segment while recording
3. WHEN the User finishes recording a Shadowing_Exercise attempt, THE App SHALL play the native audio and the User's recording sequentially for comparison
4. THE App SHALL allow the User to adjust the playback speed of the native audio in a Shadowing_Exercise to 0.5x, 0.75x, 1.0x, or 1.25x
5. THE App SHALL present the Self_Evaluation_Rubric after each Shadowing_Exercise attempt for the User to rate their performance
6. THE App SHALL track the number of Shadowing_Exercise attempts per exercise per User

### Requirement 7: Peer-to-Peer Speaking Practice

**User Story:** As a User, I want to find other students at my level for conversation practice, so that I can practice speaking Luxembourgish with a real partner.

#### Acceptance Criteria

1. THE App SHALL provide a Peer_Session matching feature that connects Users at the same Proficiency_Level for speaking practice
2. WHEN a User requests a Peer_Session, THE App SHALL search for available Users at the same Proficiency_Level who are also seeking a Peer_Session
3. WHEN a match is found, THE App SHALL notify both Users and create a Peer_Session with a shared Speaking_Prompt
4. WHILE a Peer_Session is active, THE App SHALL provide a real-time audio connection between the matched Users
5. THE App SHALL display a list of available Users at the same Proficiency_Level who have opted in to Peer_Session matching
6. THE App SHALL allow a User to set their availability status for Peer_Sessions (available, busy, or offline)
7. WHEN a Peer_Session ends, THE App SHALL prompt both Users to complete the Self_Evaluation_Rubric for the session
8. IF a matched User does not join the Peer_Session within 2 minutes, THEN THE App SHALL cancel the session and notify the waiting User

### Requirement 8: Speaking Prompts and Guided Conversations

**User Story:** As a User, I want structured speaking prompts with guided topics, so that I have clear direction during speaking practice.

#### Acceptance Criteria

1. THE App SHALL provide Speaking_Prompts within each Chapter that are relevant to the Chapter topic
2. WHEN a User opens a Speaking_Prompt, THE App SHALL display the conversation topic, suggested vocabulary, and guiding questions
3. THE App SHALL categorize Speaking_Prompts by difficulty within each Proficiency_Level
4. THE App SHALL provide Speaking_Prompts in both Learning_Paths, with Sproochentest_Preparation prompts matching exam topic formats and Daily_Life prompts covering everyday conversation scenarios

### Requirement 9: Admin Material Upload

**User Story:** As an Admin, I want to upload book chapters with PDFs, audio, and text organized by level and chapter, so that the curriculum is populated from existing textbook materials.

#### Acceptance Criteria

1. THE App SHALL provide an Admin interface for uploading curriculum materials organized by Proficiency_Level and Chapter
2. WHEN an Admin uploads materials, THE App SHALL require the Admin to specify the target Proficiency_Level, Chapter, and Skill_Component
3. THE App SHALL accept material uploads in the following formats: PDF, audio (MP3, WAV), and plain text
4. WHEN an Admin uploads a set of materials for a Chapter, THE App SHALL structure the materials into the corresponding Skill_Component sections within the Chapter
5. IF an Admin uploads a file in an unsupported format, THEN THE App SHALL reject the upload and display a descriptive error message identifying the unsupported format
6. THE App SHALL allow an Admin to preview, edit, reorder, and remove uploaded materials within a Chapter
7. WHEN an Admin publishes a Chapter, THE App SHALL make the Chapter content available to Users within 5 minutes

### Requirement 10: Gamification — XP Points

**User Story:** As a User, I want to earn XP points for completing learning activities, so that I feel a sense of accomplishment and can track my effort.

#### Acceptance Criteria

1. WHEN a User completes a Lesson, THE App SHALL award XP to the User based on the activity type: 10 XP for a lesson completion, 25 XP for a Chapter_Quiz pass, and 50 XP for a Chapter completion
2. THE App SHALL display the User's total XP on the learning dashboard
3. THE App SHALL display an XP gain notification each time the User earns XP
4. THE App SHALL store a log of all XP transactions with the activity type, amount, and timestamp for each User

### Requirement 11: Gamification — Streaks

**User Story:** As a User, I want to maintain a daily practice streak, so that I stay motivated to practice every day.

#### Acceptance Criteria

1. WHEN a User completes at least one learning activity in a calendar day, THE App SHALL increment the User's Streak count by one
2. WHEN a User does not complete any learning activity for an entire calendar day, THE App SHALL reset the User's Streak count to zero
3. THE App SHALL display the current Streak count on the learning dashboard
4. THE App SHALL store the User's longest Streak as a personal record
5. WHEN a User's Streak reaches 7, 30, or 100 consecutive days, THE App SHALL award a corresponding streak Badge

### Requirement 12: Gamification — Badges and Rewards

**User Story:** As a User, I want to earn badges for reaching milestones, so that I have visible markers of my achievements.

#### Acceptance Criteria

1. THE App SHALL award Badges to Users upon reaching defined milestones: completing a first Chapter, passing a first Chapter_Quiz, reaching 500 XP, reaching 1000 XP, completing all Chapters in a Proficiency_Level, and achieving streak milestones (7, 30, 100 days)
2. WHEN a User earns a Badge, THE App SHALL display a notification with the Badge name and description
3. THE App SHALL display all earned Badges on the User's profile page
4. THE App SHALL display locked Badges with their unlock criteria so Users can see upcoming milestones

### Requirement 13: Visual Progress Tracking

**User Story:** As a User, I want visual indicators of my progress through chapters and levels, so that I can see how far I have come and what remains.

#### Acceptance Criteria

1. THE App SHALL display a chapter map showing all Chapters in the current Proficiency_Level with visual indicators for completed, in-progress, and locked Chapters
2. THE App SHALL display a progress bar for each Chapter showing the percentage of Skill_Components completed
3. THE App SHALL display the User's current Proficiency_Level, total XP, current Streak, and number of Badges earned on the learning dashboard
4. WHEN a User completes a Chapter, THE App SHALL display a completion animation and summary of XP and Badges earned

### Requirement 14: Leaderboard

**User Story:** As a User, I want to see a leaderboard of top learners, so that I feel motivated by friendly competition.

#### Acceptance Criteria

1. THE App SHALL display a Leaderboard ranking Users by total XP earned
2. THE App SHALL provide three Leaderboard views: weekly, monthly, and all-time
3. WHEN a User views the Leaderboard, THE App SHALL highlight the User's own rank and XP within the list
4. THE App SHALL display the top 50 Users on each Leaderboard view
5. THE App SHALL update Leaderboard rankings within 5 minutes of any XP change
6. THE App SHALL display each Leaderboard entry with the User's display name, total XP, current Streak, and number of Badges earned

### Requirement 15: Student Matching for Speaking Practice

**User Story:** As a User, I want to see which students at my level are available for speaking practice, so that I can initiate a conversation session.

#### Acceptance Criteria

1. THE App SHALL display a list of Users at the same Proficiency_Level who have set their availability status to available
2. WHEN a User selects an available User from the list, THE App SHALL send a Peer_Session invitation to the selected User
3. WHEN the invited User accepts the Peer_Session invitation, THE App SHALL create a Peer_Session and connect both Users
4. IF the invited User does not respond to the Peer_Session invitation within 2 minutes, THEN THE App SHALL expire the invitation and notify the requesting User
5. WHILE a User is in an active Peer_Session, THE App SHALL set the User's availability status to busy
6. THE App SHALL display the number of currently available Users at the same Proficiency_Level on the speaking practice page
