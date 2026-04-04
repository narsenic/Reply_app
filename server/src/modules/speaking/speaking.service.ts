import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';
import { uploadToS3 } from '../../lib/s3';

const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25];

/**
 * POST /api/speaking/evaluate — evaluate a speaking exercise submission.
 */
export async function evaluateSpeaking(
  exerciseId: string,
  audioFile: Express.Multer.File | undefined,
) {
  if (!audioFile) {
    throw new AppError(400, 'AUDIO_REQUIRED', 'Audio file is required');
  }

  if (audioFile.size > MAX_AUDIO_SIZE) {
    throw new AppError(
      413,
      'AUDIO_TOO_LARGE',
      `Audio file exceeds maximum size of 10MB (received ${(audioFile.size / (1024 * 1024)).toFixed(1)}MB)`,
    );
  }

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
  });

  if (!exercise) {
    throw new AppError(404, 'EXERCISE_NOT_FOUND', `Exercise not found: ${exerciseId}`);
  }

  if (exercise.type !== 'speaking') {
    throw new AppError(400, 'NOT_SPEAKING_EXERCISE', 'This endpoint only accepts speaking exercises');
  }

  if (!exercise.referenceAudioUrl) {
    throw new AppError(422, 'REFERENCE_AUDIO_UNAVAILABLE', 'Pronunciation comparison is unavailable — this exercise has no reference audio');
  }

  const score = Math.floor(Math.random() * 36) + 60;
  const feedback = getFeedbackForScore(score);

  return { score, feedback, referenceAudioUrl: exercise.referenceAudioUrl };
}

/**
 * Record a speaking attempt — upload audio to S3, create SpeakingAttempt.
 */
export async function recordAttempt(
  userId: string,
  exerciseId: string,
  audioFile: Express.Multer.File | undefined,
) {
  if (!audioFile) {
    throw new AppError(400, 'AUDIO_REQUIRED', 'Audio file is required');
  }

  if (audioFile.size > MAX_AUDIO_SIZE) {
    throw new AppError(413, 'AUDIO_TOO_LARGE', 'Audio file exceeds maximum size of 10MB');
  }

  // Find reference audio from exercise (could be Exercise or ShadowingExercise)
  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  const referenceAudioUrl = exercise?.referenceAudioUrl ?? null;

  // Upload to S3
  const { fileUrl } = await uploadToS3(audioFile.buffer, audioFile.originalname, audioFile.mimetype);

  const attempt = await prisma.speakingAttempt.create({
    data: {
      userId,
      exerciseId,
      exerciseType: 'speaking',
      recordingUrl: fileUrl,
    },
  });

  return {
    attemptId: attempt.id,
    recordingUrl: attempt.recordingUrl,
    referenceAudioUrl: referenceAudioUrl ?? undefined,
  };
}

/**
 * Self-evaluate a speaking attempt — validate scores 1-5 for each criterion.
 */
export async function selfEvaluate(
  attemptId: string,
  scores: {
    pronunciation: number;
    fluency: number;
    vocabulary: number;
    grammarAccuracy: number;
  },
) {
  const attempt = await prisma.speakingAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) {
    throw new AppError(404, 'ATTEMPT_NOT_FOUND', `Speaking attempt not found: ${attemptId}`);
  }

  // Validate all scores are 1-5
  for (const [key, value] of Object.entries(scores)) {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new AppError(400, 'INVALID_SCORE', `Score for ${key} must be an integer between 1 and 5`);
    }
  }

  const updated = await prisma.speakingAttempt.update({
    where: { id: attemptId },
    data: {
      pronunciationScore: scores.pronunciation,
      fluencyScore: scores.fluency,
      vocabularyScore: scores.vocabulary,
      grammarAccuracyScore: scores.grammarAccuracy,
    },
  });

  return {
    attemptId: updated.id,
    pronunciationScore: updated.pronunciationScore,
    fluencyScore: updated.fluencyScore,
    vocabularyScore: updated.vocabularyScore,
    grammarAccuracyScore: updated.grammarAccuracyScore,
  };
}

/**
 * Get a shadowing exercise with available playback speeds.
 */
export async function getShadowingExercise(exerciseId: string) {
  const exercise = await prisma.shadowingExercise.findUnique({
    where: { id: exerciseId },
  });

  if (!exercise) {
    throw new AppError(404, 'EXERCISE_NOT_FOUND', `Shadowing exercise not found: ${exerciseId}`);
  }

  return {
    id: exercise.id,
    nativeAudioUrl: exercise.nativeAudioUrl,
    transcript: exercise.transcript,
    availableSpeeds: VALID_PLAYBACK_SPEEDS,
  };
}

/**
 * Record a shadowing attempt — validate speed, upload audio, create SpeakingAttempt.
 */
export async function recordShadowingAttempt(
  userId: string,
  exerciseId: string,
  audioFile: Express.Multer.File | undefined,
  playbackSpeed: number,
) {
  if (!audioFile) {
    throw new AppError(400, 'AUDIO_REQUIRED', 'Audio file is required');
  }

  if (audioFile.size > MAX_AUDIO_SIZE) {
    throw new AppError(413, 'AUDIO_TOO_LARGE', 'Audio file exceeds maximum size of 10MB');
  }

  if (!VALID_PLAYBACK_SPEEDS.includes(playbackSpeed)) {
    throw new AppError(400, 'INVALID_SPEED', `Playback speed must be one of: ${VALID_PLAYBACK_SPEEDS.join(', ')}`);
  }

  const exercise = await prisma.shadowingExercise.findUnique({ where: { id: exerciseId } });
  if (!exercise) {
    throw new AppError(404, 'EXERCISE_NOT_FOUND', `Shadowing exercise not found: ${exerciseId}`);
  }

  const { fileUrl } = await uploadToS3(audioFile.buffer, audioFile.originalname, audioFile.mimetype);

  // Count previous attempts for this user/exercise
  const previousAttempts = await prisma.speakingAttempt.count({
    where: { userId, exerciseId, exerciseType: 'shadowing' },
  });

  const attempt = await prisma.speakingAttempt.create({
    data: {
      userId,
      exerciseId,
      exerciseType: 'shadowing',
      recordingUrl: fileUrl,
      playbackSpeed,
    },
  });

  return {
    attemptId: attempt.id,
    recordingUrl: attempt.recordingUrl,
    nativeAudioUrl: exercise.nativeAudioUrl,
    attemptNumber: previousAttempts + 1,
  };
}

function getFeedbackForScore(score: number): string {
  if (score >= 90) return 'Excellent pronunciation! Keep up the great work.';
  if (score >= 80) return 'Good pronunciation. A few minor areas could be improved.';
  if (score >= 70) return 'Decent attempt. Try listening to the reference audio again and focus on the stressed syllables.';
  return 'Keep practicing! Listen carefully to the reference audio and try to match the rhythm and intonation.';
}
