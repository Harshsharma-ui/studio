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

        if (code && code.data && !isPending) {
          handleScan(code.data);
        }
      }
    }
    requestAnimationFrame(tick);
  };
  
  useEffect(() => {
    if (hasCameraPermission) {
        const animationFrame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animationFrame);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCameraPermission, isPending]);

  const handleScan = (qrCode: string) => {
    if (isPending) return;
    setStatus('scanning');
    setMessage(`Scanning code...`);
    
    startTransition(async () => {
      const result = await verifyQRCodeAction(qrCode);
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
      setMessage(result.message);
      
      // Reset status after a few seconds to allow for new scans
      setTimeout(() => {
          if (status !== 'no-camera') {
            setStatus('idle');
            setMessage('');
          }
      }, 3000);
    });
  };

  const statusIcons: Record<Exclude<ScanStatus, 'scanning'>, React.ReactNode> = {
    idle: <QrCode className="h-16 w-16 text-muted-foreground" />,
    success: <CheckCircle className="h-16 w-16 text-green-500" />,
    error: <XCircle className="h-16 w-16 text-destructive" />,
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
          Point your camera at a QR code to check-in an attendee.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div
          className={cn(
            'relative flex h-64 w-full items-center justify-center rounded-lg bg-secondary transition-all duration-300 overflow-hidden',
             status === 'success' && 'ring-4 ring-green-500',
             status === 'error' && 'ring-4 ring-destructive',
          )}
        >
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                {isPending ? <Loader className="h-16 w-16 animate-spin text-primary" /> : statusIcons[status === 'scanning' ? 'idle' : status]}
            </div>

            {/* Scanning overlay */}
            {!isPending && status === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3/4 h-3/4 border-4 border-dashed border-white/50 rounded-lg"/>
                </div>
            )}
        </div>

        {message && (
          <Alert variant={status === 'success' ? 'default' : 'destructive'} className={cn('text-center', status === 'success' && 'border-green-500/50')}>
             {status === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle className="font-semibold">
              {status === 'success' ? 'Success' : 'Validation Failed'}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        {hasCameraPermission === false && (
             <Alert variant="destructive">
                <CameraOff className="h-4 w-4" />
                <AlertTitle>No Camera Access</AlertTitle>
                <AlertDescription>
                    Please grant camera permissions in your browser to use the scanner.
                </AlertDescription>
            </Alert>
        )}

      </CardContent>
    </Card>
  );
}
