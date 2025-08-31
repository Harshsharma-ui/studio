'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAiSuggestionAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PersonalizedEventSuggestionsOutput } from '@/ai/flows/personalized-event-suggestions';

const formSchema = z.object({
  userPreferences: z.string().min(20, 'Please provide more details about your preferences.').max(1000),
  pastAttendance: z.string().min(20, 'Please provide more details about events you attended.').max(1000),
  eventDescription: z.string().min(20, 'Please provide a more detailed event description.').max(2000),
});

type FormValues = z.infer<typeof formSchema>;

export function AiSuggester() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PersonalizedEventSuggestionsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userPreferences: 'I enjoy tech conferences, particularly those focused on AI, machine learning, and frontend development. I prefer hands-on workshops over general talks.',
      pastAttendance: 'Attended "AI Dev Day 2023" which had great keynotes on large language models. Also went to "React Forward" and enjoyed the sessions on Next.js and server components.',
      eventDescription: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    setResult(null);
    setError(null);
    startTransition(async () => {
      const response = await getAiSuggestionAction(values);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        const errorMessage = response.error?.formErrors?.[0] || 'Failed to get suggestion.';
        setError(errorMessage);
        form.setError('root', { message: errorMessage });
      }
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary" />
          AI Event Suggester
        </CardTitle>
        <CardDescription>
          Get personalized event recommendations. Fill in your preferences and an event description to see if it's a good fit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="userPreferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Preferences</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., I like outdoor music festivals, tech talks on AI..." {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pastAttendance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Past Events You Enjoyed</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Attended Coachella last year, went to a local hackathon..." {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="eventDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event to Evaluate</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste the event description here..." {...field} rows={5}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Get Suggestion
            </Button>
          </form>
        </Form>
        
        {isPending && (
            <div className="mt-6 flex items-center justify-center text-muted-foreground">
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                <span>Thinking...</span>
            </div>
        )}

        {result && !isPending && (
          <Alert className="mt-6" variant={result.isRelevant ? 'default' : 'destructive'}>
            {result.isRelevant ? <ThumbsUp className="h-4 w-4 text-green-600" /> : <ThumbsDown className="h-4 w-4" />}
            <AlertTitle className="font-bold">
              {result.isRelevant ? "This event seems like a great fit!" : "This might not be for you."}
            </AlertTitle>
            <AlertDescription>{result.reason}</AlertDescription>
          </Alert>
        )}
        
        {error && !isPending && (
            <Alert className="mt-6" variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
