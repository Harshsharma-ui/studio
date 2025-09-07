
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Loader, QrCode, User, Download } from 'lucide-react';
import QRCode from 'qrcode.react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


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
      // Update state incrementally to show progress if needed, or just wait till the end.
      // For now, we'll update at the end.
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
        title: 'Preparing Download',
        description: 'Generating zip file of all QR codes. This might take a while...',
    });

    try {
        const zip = new JSZip();
        
        // This process can be slow for 5000 codes, let's do it in chunks.
        for (let i = 0; i < codes.length; i++) {
            const { memberId, qrCode } = codes[i];
            const canvas = document.createElement('canvas');
            const qrCodeInstance = new (QRCode as any)({ value: qrCode, size: 256, level: 'H' });
            const dataUrl = qrCodeInstance.toDataURL('image/png');
            const pngData = dataUrl.split(',')[1];
            zip.file(`${memberId}.png`, pngData, { base64: true });

            // To avoid freezing the browser, we can yield to the main thread periodically.
            if (i % 100 === 0) {
                 await new Promise(resolve => setTimeout(resolve, 0));
            }
        }


        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, 'all-qr-codes.zip');
        
        toast({
            title: 'Download Ready',
            description: 'The zip file has been created and is downloading.',
        });

    } catch (error) {
        console.error("Failed to generate zip file", error);
        toast({
            variant: 'destructive',
            title: 'Download Failed',
            description: 'Could not generate the zip file.',
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
          A list of persistent QR codes for event passes. These codes will remain valid for the duration of the server session.
          <Button onClick={handleDownloadAll} disabled={isLoading || isDownloading}>
            {isDownloading ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            Download All
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
