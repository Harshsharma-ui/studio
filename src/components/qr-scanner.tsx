'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { CheckCircle, QrCode, XCircle, Loader, Ticket } from 'lucide-react';
import QRCode from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { verifyQRCodeAction, getSampleCodeAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

const REFRESH_INTERVAL = 10000; // 10 seconds

export function QrScanner() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout>();
   const progressIntervalRef = useRef<NodeJS.Timeout>();

  const fetchNewCode = async () => {
    const sample = await getSampleCodeAction();
    if (sample.code) {
      setCurrentCode(sample.code);
      resetProgress();
    } else {
      setCurrentCode(null);
      toast({
        variant: 'destructive',
        title: 'Simulation Over',
        description: "No more valid QR codes to test.",
      });
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
  };
  
  const resetProgress = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setProgress(100);
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = 100 - (elapsedTime / REFRESH_INTERVAL) * 100;
      if (newProgress <= 0) {
        setProgress(0);
        clearInterval(progressIntervalRef.current);
      } else {
        setProgress(newProgress);
      }
    }, 100);
  };

  useEffect(() => {
    fetchNewCode();
    intervalRef.current = setInterval(fetchNewCode, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const handleScan = (type: 'valid' | 'invalid') => {
    setStatus('scanning');
    setMessage('');
    
    startTransition(async () => {
      let codeToScan: string | null;

      if (type === 'valid') {
         codeToScan = currentCode;
         if (!codeToScan) {
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
        // Fetch a new code immediately after successful scan
        if (type === 'valid') {
            if (intervalRef.current) clearInterval(intervalRef.current);
            fetchNewCode();
            intervalRef.current = setInterval(fetchNewCode, REFRESH_INTERVAL);
        }
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
          A new QR code is generated every 10 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div
          className={cn(
            'flex h-48 w-48 items-center justify-center rounded-lg bg-secondary transition-all duration-300 p-4',
             status === 'success' && 'bg-green-100 dark:bg-green-900/20',
             status === 'error' && 'bg-red-100 dark:bg-red-900/20',
             isPending && 'animate-pulse'
          )}
        >
          {isPending ? (
            statusIcons.scanning
          ) : currentCode ? (
            <div className="bg-white p-2 rounded-md">
                <QRCode value={currentCode} size={160} level="H" />
            </div>
          ) : (
            statusIcons.idle
          )}
        </div>

        {currentCode && (
            <div className="w-full px-4">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center mt-1">QR code refreshes in {Math.ceil(progress/10)}s</p>
            </div>
        )}

        {message && (
          <Alert variant={status === 'success' ? 'default' : 'destructive'} className={cn('text-center', status === 'success' && 'border-green-500/50')}>
             {status === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle className="font-semibold">
              {status === 'success' ? 'Success' : 'Validation Failed'}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={() => handleScan('valid')}
            disabled={isPending || !currentCode}
            size="lg"
            className="w-full"
          >
            {isPending && status === 'scanning' ? <Loader className="mr-2"/> : <Ticket className="mr-2 h-5 w-5" />}
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
            Click "Scan Valid Code" to simulate a successful check-in with the QR code displayed above. A new code is generated after each scan or every 10 seconds.
        </p>
      </CardContent>
    </Card>
  );
}
