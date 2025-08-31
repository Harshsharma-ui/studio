
'use client';

import { useState, useEffect } from 'react';
import { Loader, QrCode, User } from 'lucide-react';
import QRCode from 'qrcode.react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPreGeneratedCodesAction } from '@/app/actions';
import { ScrollArea } from './ui/scroll-area';

interface GeneratedCode {
  memberId: string;
  qrCode: string;
}

const PRE_DEFINED_MEMBERS = Array.from({ length: 5000 }, (_, i) => `member-${i + 1}`);

export function PreGeneratedCodes() {
  const [codes, setCodes] = useState<GeneratedCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        setIsLoading(true);
        const response = await getPreGeneratedCodesAction(PRE_DEFINED_MEMBERS);
        setCodes(response);
      } catch (error) {
        console.error("Failed to fetch pre-generated codes", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCodes();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="text-primary" />
          Pre-generated Member QR Codes
        </CardTitle>
        <CardDescription>
          A list of persistent QR codes for event passes. These codes will remain valid for the duration of the server session.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
                            <QRCode value={qrCode} size={128} level="H" />
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
