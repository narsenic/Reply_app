import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';

const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/speaking/evaluate — evaluate a speaking exercise submission.
 *
 * For the MVP this is a stub: it validates the exercise exists and is a
 * speaking exercise, checks the uploaded audio, then returns a random
 * score with generic feedback plus the exercise's reference audio URL.
 */
export async function evaluateSpeaking(
  exerciseId: string,
  audioFile: Express.Multer.File | undefined,
) {
  // 1. Validate audio file presence
  if (!audioFile) {
    throw new AppError(400, 'AUDIO_REQUIRED', 'Audio file is required');
  }

  // 2. Validate audio file size
  if (audioFile.size > MAX_AUDIO_SIZE) {
    throw new AppError(
      413,
      'AUDIO_TOO_LARGE',
      `Audio file exceeds maximum size of 10MB (received ${(audioFile.size / (1024 * 1024)).toFixed(1)}MB)`,
    );
  }

  // 3. Validate exercise exists and is a speaking exercise
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
  });

  if (!exercise) {
    throw new AppError(404, 'EXERCISE_NOT_FOUND', `Exercise not found: ${exerciseId}`);
  }

  if (exercise.type !== 'speaking') {
    throw new AppError(
      400,
      'NOT_SPEAKING_EXERCISE',
      'This endpoint only accepts speaking exercises',
    );
  }

  // 4. Check for reference audio
  if (!exercise.referenceAudioUrl) {
    throw new AppError(
      422,
      'REFERENCE_AUDIO_UNAVAILABLE',
      'Pronunciation comparison is unavailable — this exercise has no reference audio',
    );
  }

  // 5. MVP stub: return random score between 60-95 with generic feedback
  const score = Math.floor(Math.random() * 36) + 60; // 60–95

  const feedback = getFeedbackForScore(score);

  return {
    score,
    feedback,
    referenceAudioUrl: exercise.referenceAudioUrl,
  };
}

function getFeedbackForScore(score: number): string {
  if (score >= 90) return 'Excellent pronunciation! Keep up the great work.';
  if (score >= 80) return 'Good pronunciation. A few minor areas could be improved.';
  if (score >= 70) return 'Decent attempt. Try listening to the reference audio again and focus on the stressed syllables.';
  return 'Keep practicing! Listen carefully to the reference audio and try to match the rhythm and intonation.';
}
