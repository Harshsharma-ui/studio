'use client';

import { useState, useTransition } from 'react';
import { CheckCircle, QrCode, XCircle, Loader, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { verifyQRCodeAction, getSampleCodeAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

export function QrScanner() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleScan = (type: 'valid' | 'invalid') => {
    setStatus('scanning');
    setMessage('');

    startTransition(async () => {
      let codeToScan: string;

      if (type === 'valid') {
        const sample = await getSampleCodeAction();
        if (sample.code) {
          codeToScan = sample.code;
        } else {
          toast({
            variant: 'destructive',
            title: 'Simulation Over',
            description: "No more valid QR codes to test.",
          });
          setStatus('error');
          setMessage('No more valid QR codes left for simulation.');
          return;
        }
      } else {
        // Use a string that is not a valid UUID to simulate an invalid code
        codeToScan = 'invalid-qr-code-for-testing';
      }

      const result = await verifyQRCodeAction(codeToScan);
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
      setMessage(result.message);
    });
  };

  const statusIcons: Record<ScanStatus, React.ReactNode> = {
    idle: <QrCode className="h-16 w-16 text-muted-foreground" />,
    scanning: <Loader className="h-16 w-16 animate-spin text-primary" />,
    success: <CheckCircle className="h-16 w-16 text-green-500" />,
    error: <XCircle className="h-16 w-16 text-destructive" />,
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-center">QR Code Check-in</CardTitle>
        <CardDescription className="text-center">
          Simulate scanning attendee QR codes for validation.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div
          className={cn(
            'flex h-40 w-40 items-center justify-center rounded-lg bg-secondary transition-all duration-300',
            status === 'success' && 'bg-green-100 dark:bg-green-900/20',
            status === 'error' && 'bg-red-100 dark:bg-red-900/20'
          )}
        >
          {statusIcons[status]}
        </div>

        {message && (
          <Alert variant={status === 'success' ? 'default' : 'destructive'} className={cn('text-center', status === 'success' && 'border-green-500/50')}>
            <AlertTitle className="font-semibold">
              {status === 'success' ? 'Success' : 'Validation Failed'}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={() => handleScan('valid')}
            disabled={isPending}
            size="lg"
            className="w-full"
          >
            <Ticket className="mr-2 h-5 w-5" />
            Scan Valid Code
          </Button>
          <Button
            onClick={() => handleScan('invalid')}
            disabled={isPending}
            size="lg"
            variant="outline"
            className="w-full"
          >
            <XCircle className="mr-2 h-5 w-5" />
            Scan Invalid Code
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center px-4">
            Click "Scan Valid Code" to simulate a successful check-in with a new, valid code from the backend.
        </p>
      </CardContent>
    </Card>
  );
}
