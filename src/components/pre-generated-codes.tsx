
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
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

  const fetchCodesInBatches = useCallback(async () => {
    setIsLoading(true);
    let allCodes: GeneratedCode[] = [];
    try {
      for (let i = 0; i < PRE_DEFINED_MEMBERS.length; i += BATCH_SIZE) {
        const batch = PRE_DEFINED_MEMBERS.slice(i, i + BATCH_SIZE);
        const response = await getPreGeneratedCodesAction(batch);
        allCodes = [...allCodes, ...response];
      }
      setCodes(allCodes);
    } catch (error) {
      console.error("Failed to fetch pre-generated codes", error);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Codes',
        description: 'Could not load the list of pre-generated QR codes.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    startFetchingTransition(() => {
        fetchCodesInBatches();
    });
  }, [fetchCodesInBatches]);

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
        const qrCanvases = document.querySelectorAll('.qr-code-canvas');
        const canvasMap = new Map<string, HTMLCanvasElement>();
        qrCanvases.forEach(canvas => {
            const qrCanvas = canvas as HTMLCanvasElement;
            const memberId = qrCanvas.getAttribute('data-member-id');
            if (memberId) {
                canvasMap.set(memberId, qrCanvas);
            }
        });


        for (let i = 0; i < codes.length; i++) {
            const { memberId, qrCode } = codes[i];
            
            const finalCanvas = document.createElement('canvas');
            const ctx = finalCanvas.getContext('2d');
            if (!ctx) continue;

            const qrSize = 256;
            const padding = 20;
            const textHeight = 60;
            
            finalCanvas.width = qrSize + padding * 2;
            finalCanvas.height = qrSize + padding * 2 + textHeight;
            
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

            const qrCanvas = canvasMap.get(memberId);

            if (qrCanvas) {
                // Scale the 128x128 canvas to 256x256 for better quality
                ctx.drawImage(qrCanvas, padding, padding, qrSize, qrSize);
            }
            
            ctx.fillStyle = 'black';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Member: ${memberId}`, finalCanvas.width / 2, qrSize + padding + 25);
            ctx.font = '12px sans-serif';
            ctx.fillText(`Code: ${qrCode}`, finalCanvas.width / 2, qrSize + padding + 45);

            const link = document.createElement('a');
            link.download = `${memberId}.jpg`;
            link.href = finalCanvas.toDataURL('image/jpeg');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if ((i + 1) % 50 === 0 || i === codes.length - 1) {
                toast({
                    title: 'Download in Progress',
                    description: `Downloaded ${i + 1} of ${codes.length} codes.`,
                });
            }

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
                            <QRCode value={qrCode} size={128} level="H" renderAs="canvas" className="qr-code-canvas" data-member-id={memberId} />
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
