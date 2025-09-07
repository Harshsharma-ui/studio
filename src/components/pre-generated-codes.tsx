
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Loader, QrCode, User, Download } from 'lucide-react';
import QRCode from 'qrcode.react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPreGeneratedCodesAction } from '@/app/actions';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface GeneratedCode {
  memberId: string;
  qrCode: string;
}

const PRE_DEFINED_MEMBERS = Array.from({ length: 5000 }, (_, i) => `member-${i + 1}`);
const BATCH_SIZE = 100;

export function PreGeneratedCodes() {
  const [codes, setCodes] = useState<GeneratedCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const [isFetching, startFetchingTransition] = useTransition();

  const fetchCodesInBatches = async () => {
    setIsLoading(true);
    let allCodes: GeneratedCode[] = [];
    for (let i = 0; i < PRE_DEFINED_MEMBERS.length; i += BATCH_SIZE) {
      const batch = PRE_DEFINED_MEMBERS.slice(i, i + BATCH_SIZE);
      const response = await getPreGeneratedCodesAction(batch);
      allCodes = [...allCodes, ...response];
    }
    setCodes(allCodes);
    setIsLoading(false);
  };

  useEffect(() => {
    startFetchingTransition(() => {
        fetchCodesInBatches();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadAll = async () => {
    if (isLoading) {
        toast({
            variant: 'destructive',
            title: 'Please Wait',
            description: 'Codes are still being generated. Please wait until loading is complete.',
        });
        return;
    }

    setIsDownloading(true);
    toast({
        title: 'Starting Download',
        description: 'Your browser may ask for permission to download multiple files. Please allow it.',
    });

    const downloadDelay = 100; // ms between each download to avoid browser blocking

    try {
        for (let i = 0; i < codes.length; i++) {
            const { memberId, qrCode } = codes[i];
            
            // Create a canvas to combine QR code and text
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            const qrSize = 256;
            const padding = 20;
            const textHeight = 40;
            
            canvas.width = qrSize + padding * 2;
            canvas.height = qrSize + padding * 2 + textHeight;
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw the QR code
            const tempCanvas = document.createElement('canvas');
            const qrNode = <QRCode value={qrCode} size={qrSize} level="H" />;
            const qrCanvas: HTMLCanvasElement | null = document.querySelector('.qr-code-canvas');

            // We need a rendered QR code to draw it. A bit of a hack: render it, grab it, draw it.
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);
            
            const qrComponent = new (QRCode as any)({ value: qrCode, size: qrSize, level: 'H', renderAs: 'canvas' });
            const dataUrl = qrComponent.toDataURL('image/png');
            
            const img = new Image();
            await new Promise(resolve => {
                img.onload = resolve;
                img.src = dataUrl;
            });
            
            ctx.drawImage(img, padding, padding);

            document.body.removeChild(tempDiv);

            // Draw the text
            ctx.fillStyle = 'black';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Member: ${memberId}`, canvas.width / 2, qrSize + padding + 25);
            ctx.font = '12px sans-serif';
            ctx.fillText(`Code: ${qrCode}`, canvas.width / 2, qrSize + padding + 45);

            // Trigger download
            const link = document.createElement('a');
            link.download = `${memberId}.jpg`;
            link.href = canvas.toDataURL('image/jpeg');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show progress toast
            if ((i + 1) % 50 === 0 || i === codes.length - 1) {
                toast({
                    title: 'Download in Progress',
                    description: `Downloaded ${i + 1} of ${codes.length} codes.`,
                });
            }

            // Wait a bit before the next download
            await new Promise(resolve => setTimeout(resolve, downloadDelay));
        }
        
        toast({
            title: 'Download Complete',
            description: 'All QR codes have been downloaded.',
        });

    } catch (error) {
        console.error("Failed to generate or download files", error);
        toast({
            variant: 'destructive',
            title: 'Download Failed',
            description: 'An error occurred during the download process.',
        });
    } finally {
        setIsDownloading(false);
    }
  };


  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="text-primary" />
          Pre-generated Member QR Codes
        </CardTitle>
        <CardDescription className="flex justify-between items-center">
          A list of persistent QR codes for event passes. These codes will remain valid.
          <Button onClick={handleDownloadAll} disabled={isLoading || isDownloading}>
            {isDownloading ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            Download All (JPGs)
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Loader className="mr-2 h-5 w-5 animate-spin" />
            <span>Generating codes... This may take a moment for 5000 codes.</span>
          </div>
        ) : (
          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
                {codes.map(({ memberId, qrCode }) => (
                    <div key={memberId} className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-card shadow-sm">
                        <div className="bg-white p-2 rounded-lg">
                            <QRCode value={qrCode} size={128} level="H" renderAs="canvas" className="qr-code-canvas" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold flex items-center gap-2"><User className="text-muted-foreground"/> {memberId}</p>
                            <p className="text-xs text-muted-foreground break-all px-2">{qrCode}</p>
                        </div>
                    </div>
                ))}
            </div>
           </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
