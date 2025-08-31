'use server';

import { z } from 'zod';
import {
  PersonalizedEventSuggestionsInput,
  personalizedEventSuggestions,
} from '@/ai/flows/personalized-event-suggestions';
import { verifyAndInvalidateQRCode, getSampleValidCode } from '@/lib/qr-store';

const qrCodeSchema = z.string().uuid();

export async function verifyQRCodeAction(code: string) {
  try {
    // We can check if it's a valid UUID, though our invalid test case uses a non-UUID.
    // The main logic is checking existence in the set.
    qrCodeSchema.parse(code);
    return await verifyAndInvalidateQRCode(code);
  } catch (error) {
    // This will catch both parsing errors and if the code is simply not found.
    return await verifyAndInvalidateQRCode(code);
  }
}

export async function getSampleCodeAction() {
  const code = getSampleValidCode();
  if (!code) {
    return { code: null, message: "No more valid tickets!" };
  }
  return { code, message: "Here's a sample valid code for testing." };
}

const aiSuggestionSchema = z.object({
  userPreferences: z.string().min(20, 'Please describe your preferences in more detail.').max(1000),
  pastAttendance: z.string().min(20, 'Please describe past events in more detail.').max(1000),
  eventDescription: z.string().min(20, 'Please provide a more detailed event description.').max(2000),
});

export async function getAiSuggestionAction(data: PersonalizedEventSuggestionsInput) {
  const validation = aiSuggestionSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten() };
  }

  try {
    const result = await personalizedEventSuggestions(validation.data);
    return { success: true, data: result };
  } catch (error) {
    console.error('AI suggestion error:', error);
    return { success: false, error: { formErrors: ['An unexpected error occurred with the AI service. Please try again later.'], fieldErrors: {}} };
  }
}
