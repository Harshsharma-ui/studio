
'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, QrCode, XCircle, Loader, Camera, CameraOff, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { verifyQRCodeAction, checkInMemberByIdAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import jsQR from 'jsqr';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Separator } from './ui/separator';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error' | 'no-camera';

const formSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required.'),
});

type FormValues = z.infer<typeof formSchema>;


export function QrScanner() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isManualCheckinPending, startManualCheckinTransition] = useTransition();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: '',
    },
  });

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setStatus('no-camera');
        setMessage('Camera access denied. Please enable camera permissions in your browser settings.');
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    }
  }, [toast]);

  const tick = () => {
    if (isPending || status !== 'idle' || isManualCheckinPending) return;

    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleScan(code.data);
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };
  
  useEffect(() => {
    if (hasCameraPermission && status === 'idle' && !isPending && !isManualCheckinPending) {
        requestRef.current = requestAnimationFrame(tick);
    }
    return () => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCameraPermission, status, isPending, isManualCheckinPending]);

  const handleScan = (qrCode: string) => {
    if (isPending) return;
    
    // Stop scanning
    if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
    }

    setStatus('scanning');
    setMessage(`Verifying code...`);
    
    startTransition(async () => {
      const result = await verifyQRCodeAction(qrCode);
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
      setMessage(result.message);
      
      setTimeout(() => {
          if (status !== 'no-camera') {
            setStatus('idle');
            setMessage('');
          }
      }, 3000);
    });
  };

  const onManualSubmit = (values: FormValues) => {
    startManualCheckinTransition(async () => {
      // We can use verifyQRCodeAction for manual entry as well since it now handles member IDs.
      // This keeps the logic consistent.
      const result = await verifyQRCodeAction(values.memberId);
      if (result.success) {
        toast({
          title: 'Check-in Successful',
          description: result.message,
        });
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Check-in Failed',
          description: result.message,
        });
      }
    });
  };

  const statusIcons: Record<Exclude<ScanStatus, 'scanning'>, React.ReactNode> = {
    idle: <QrCode className="h-16 w-16 text-white/80" />,
    success: <CheckCircle className="h-24 w-24 text-white" />,
    error: <XCircle className="h-24 w-24 text-white" />,
    'no-camera': <CameraOff className="h-16 w-16 text-muted-foreground" />,
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
            <Camera />
            Live Event Check-in
        </CardTitle>
        <CardDescription className="text-center">
          Point your camera at a QR code or enter a Member ID/Code below.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div
          className={cn(
            'relative flex h-64 w-full items-center justify-center rounded-lg bg-secondary overflow-hidden border-4 border-transparent',
          )}
        >
            <video ref={videoRef} className="w-full h-full object-cover scale-105" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            <div className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/50 transition-all duration-300",
              status === 'success' && 'bg-green-500/80',
              status === 'error' && 'bg-red-500/80',
            )}>
                {(isPending || isManualCheckinPending) ? <Loader className="h-16 w-16 animate-spin text-primary-foreground" /> : statusIcons[status === 'scanning' ? 'idle' : status]}
            </div>

            {/* Scanning overlay */}
            {!isPending && status === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3/4 h-3/4 border-4 border-dashed border-white/50 rounded-lg animate-pulse"/>
                </div>
            )}
        </div>

        {(message && (status === 'success' || status === 'error')) && (
          <Alert variant={status === 'success' ? 'default' : 'destructive'} className={cn('text-center', status === 'success' && 'border-green-500/50 bg-green-50 dark:bg-green-900/10')}>
             {status === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle className="font-semibold">
              {status === 'success' ? 'Success' : 'Validation Failed'}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        {status === 'no-camera' && (
             <Alert variant="destructive">
                <CameraOff className="h-4 w-4" />
                <AlertTitle>Camera Not Available</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
            </Alert>
        )}

        <Separator className="w-full" />

        <div className="w-full space-y-4">
            <div className="text-center">
                <h3 className="font-semibold">Manual Check-in</h3>
                <p className="text-sm text-muted-foreground">If QR scanning is not possible, enter the Member ID or Code.</p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onManualSubmit)} className="flex items-start gap-2">
                    <FormField
                    control={form.control}
                    name="memberId"
                    render={({ field }) => (
                        <FormItem className="flex-grow">
                        <FormControl>
                            <Input placeholder="Enter Member ID or 8-digit code" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={isManualCheckinPending}>
                        {isManualCheckinPending ? <Loader className="animate-spin" /> : <UserCheck />}
                        <span className="sr-only">Check-in</span>
                    </Button>
                </form>
            </Form>
        </div>

      </CardContent>
    </Card>
  );
}
