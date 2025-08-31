
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader, QrCode, UserPlus, RefreshCcw } from 'lucide-react';
import QRCode from 'qrcode.react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateMemberCodeAction, resetAllDataAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

const formSchema = z.object({
  memberId: z.string().min(2, 'Member ID must be at least 2 characters.').max(50),
});

type FormValues = z.infer<typeof formSchema>;

export function AdminQrGenerator() {
  const [isPending, startTransition] = useTransition();
  const [isResetting, startResetTransition] = useTransition();
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedFor, setGeneratedFor] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    setGeneratedCode(null);
    setGeneratedFor(null);
    setError(null);
    startTransition(async () => {
      const response = await generateMemberCodeAction(values.memberId);
      if (response.success && response.code) {
        setGeneratedCode(response.code);
        setGeneratedFor(values.memberId);
        form.reset();
      } else {
        setError(response.message || 'Failed to generate QR code.');
      }
    });
  };

  const handleReset = () => {
    startResetTransition(async () => {
        const response = await resetAllDataAction();
        if (response.success) {
            toast({
                title: 'Success',
                description: response.message,
            });
            setGeneratedCode(null);
            setGeneratedFor(null);
            setError(null);
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: response.message,
            });
        }
    });
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="text-primary" />
          Generate Member QR Code
        </CardTitle>
        <CardDescription>
          Enter a unique ID for a member to generate their event access QR code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., user@example.com or a unique ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending || isResetting} className="w-full">
              {isPending ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              Generate Code
            </Button>
          </form>
        </Form>
        
        {isPending && (
            <div className="mt-6 flex items-center justify-center text-muted-foreground">
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                <span>Generating...</span>
            </div>
        )}

        {generatedCode && generatedFor && !isPending && (
          <div className="mt-6 flex flex-col items-center gap-4">
             <Alert>
                <QrCode className="h-4 w-4" />
                <AlertTitle>QR Code for {generatedFor}</AlertTitle>
                <AlertDescription>
                    This code is unique. Download or screenshot it to share with the member.
                </AlertDescription>
             </Alert>
            <div className="bg-white p-4 rounded-lg border">
              <QRCode value={generatedCode} size={256} level="H" />
            </div>
            <p className="text-xs text-muted-foreground break-all px-4">{generatedCode}</p>
          </div>
        )}
        
        {error && !isPending && (
            <Alert className="mt-6" variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <Separator className="my-8" />
        
        <div className="space-y-4">
            <div className="text-center">
                <h3 className="font-semibold">Event Controls</h3>
                <p className="text-sm text-muted-foreground">Reset all event data.</p>
            </div>
             <Button variant="destructive" onClick={handleReset} disabled={isResetting} className="w-full">
                {isResetting ? (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <RefreshCcw className="mr-2 h-4 w-4" />
                )}
                Reset All Data
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
