'use server';

import { z } from 'zod';
import {
  PersonalizedEventSuggestionsInput,
  personalizedEventSuggestions,
} from '@/ai/flows/personalized-event-suggestions';
import { verifyAndInvalidateQRCode, generateMemberQRCode, getCheckedInMembers, checkInMemberById, resetAllData, getPreGeneratedCodes } from '@/lib/qr-store';

const qrCodeSchema = z.string().min(1, 'QR Code cannot be empty');
const memberIdSchema = z.string().min(1, 'Member ID cannot be empty');

export async function resetAllDataAction() {
    return await resetAllData();
}

export async function verifyQRCodeAction(code: string) {
  try {
    qrCodeSchema.parse(code);
    return await verifyAndInvalidateQRCode(code);
  } catch (error) {
    return { success: false, message: 'Invalid QR code format.' };
  }
}

export async function checkInMemberByIdAction(memberId: string) {
    try {
        memberIdSchema.parse(memberId);
        return await checkInMemberById(memberId);
    } catch (error) {
        return { success: false, message: 'Invalid member ID format.' };
    }
}

export async function generateMemberCodeAction(memberId: string) {
  try {
    memberIdSchema.parse(memberId);
    const code = await generateMemberQRCode(memberId);
    return { success: true, code, message: `QR Code generated for ${memberId}.` };
  } catch (error) {
    return { success: false, code: null, message: 'Failed to generate QR code. Invalid Member ID.' };
  }
}

export async function getCheckedInMembersAction() {
    return await getCheckedInMembers();
}

export async function getPreGeneratedCodesAction(memberIds: string[]) {
    return await getPreGeneratedCodes(memberIds);
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
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
