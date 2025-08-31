'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { CheckCircle, QrCode, XCircle, Loader, Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { verifyQRCodeAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import jsQR from 'jsqr';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error' | 'no-camera';

export function QrScanner() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

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
    }
  }, [toast]);

  const tick = () => {
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

        if (code && code.data && !isPending && status === 'idle') {
          handleScan(code.data);
        }
      }
    }
    requestAnimationFrame(tick);
  };
  
  useEffect(() => {
    let animationFrameId: number;
    if (hasCameraPermission && status === 'idle') {
        const tickWrapper = () => {
            tick();
            animationFrameId = requestAnimationFrame(tickWrapper);
        }
        animationFrameId = requestAnimationFrame(tickWrapper);
    }
    return () => cancelAnimationFrame(animationFrameId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCameraPermission, isPending, status]);

  const handleScan = (qrCode: string) => {
    if (isPending) return;
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
            Live QR Code Scanner
        </CardTitle>
        <CardDescription className="text-center">
          Point your camera at a member's QR code to check them in.
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
                {isPending ? <Loader className="h-16 w-16 animate-spin text-primary-foreground" /> : statusIcons[status === 'scanning' ? 'idle' : status]}
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
      </CardContent>
    </Card>
  );
}
