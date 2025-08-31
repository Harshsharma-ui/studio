'use server';

/**
 * @fileOverview Personalized event suggestions flow using Genkit.
 *
 * This file defines a Genkit flow for providing personalized event suggestions
 * based on user preferences and past attendance.
 *
 * @exports {
 *   personalizedEventSuggestions,
 *   PersonalizedEventSuggestionsInput,
 *   PersonalizedEventSuggestionsOutput
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedEventSuggestionsInputSchema = z.object({
  userPreferences: z
    .string()
    .describe('User preferences regarding event types, topics, etc.'),
  pastAttendance: z
    .string()
    .describe(
      'History of events the user has attended, including names and descriptions.'
    ),
  eventDescription: z.string().describe(
    'The description of the event to process, used for the filtering process'
  ),
});

export type PersonalizedEventSuggestionsInput =
  z.infer<typeof PersonalizedEventSuggestionsInputSchema>;

const PersonalizedEventSuggestionsOutputSchema = z.object({
  isRelevant: z
    .boolean()
    .describe(
      'A boolean value indicating whether the event is relevant to the user based on their preferences and past attendance.'
    ),
  reason: z
    .string()
    .describe(
      'A brief explanation of why the event is relevant or irrelevant to the user.'
    ),
});

export type PersonalizedEventSuggestionsOutput =
  z.infer<typeof PersonalizedEventSuggestionsOutputSchema>;

export async function personalizedEventSuggestions(
  input: PersonalizedEventSuggestionsInput
): Promise<PersonalizedEventSuggestionsOutput> {
  return personalizedEventSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedEventSuggestionsPrompt',
  input: {schema: PersonalizedEventSuggestionsInputSchema},
  output: {schema: PersonalizedEventSuggestionsOutputSchema},
  prompt: `Based on the user's preferences and past event attendance, determine if the following event is relevant to them.\n\nUser Preferences: {{{userPreferences}}}\nPast Attendance: {{{pastAttendance}}}\nEvent Description: {{{eventDescription}}}\n\nConsider the user's interests and the events they have previously attended. If the event aligns with their preferences and past attendance, indicate that it is relevant. Provide a reason for your determination.\n\nOutput a JSON object with 'isRelevant' (true or false) and 'reason' fields.\n`,
});

const personalizedEventSuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedEventSuggestionsFlow',
    inputSchema: PersonalizedEventSuggestionsInputSchema,
    outputSchema: PersonalizedEventSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
