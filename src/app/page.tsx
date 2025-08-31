
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrScanner } from "@/components/qr-scanner";
import { AiSuggester } from "@/components/ai-suggester";
import { AdminQrGenerator } from "@/components/admin-qr-generator";
import { Icons } from "@/components/icons";
import { QrCode, ShieldCheck, Users } from "lucide-react";
import { PreGeneratedCodes } from "@/components/pre-generated-codes";
import { CheckedInList } from "@/components/checked-in-list";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
      <header className="flex flex-col items-center gap-2 mb-8">
        <div className="flex items-center gap-3 text-primary">
          <Icons.Logo className="h-10 w-10" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            AttendEase
          </h1>
        </div>
        <p className="text-muted-foreground text-center max-w-md">
          Effortless event check-in and AI-powered discovery.
        </p>
      </header>
      
      <Tabs defaultValue="scanner" className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="admin">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Admin
          </TabsTrigger>
          <TabsTrigger value="scanner">QR Check-in</TabsTrigger>
          <TabsTrigger value="checked-in">
              <Users className="mr-2 h-4 w-4" />
              Checked-in
          </TabsTrigger>
          <TabsTrigger value="pre-generated">
              <QrCode className="mr-2 h-4 w-4" />
              Pre-generated
          </TabsTrigger>
          <TabsTrigger value="ai-suggester">AI Event Suggester</TabsTrigger>
        </TabsList>
        <TabsContent value="admin" className="mt-6">
          <div className="flex justify-center">
            <AdminQrGenerator />
          </div>
        </TabsContent>
        <TabsContent value="scanner" className="mt-6">
          <div className="flex justify-center">
            <QrScanner />
          </div>
        </TabsContent>
        <TabsContent value="checked-in" className="mt-6">
            <div className="flex justify-center">
                <CheckedInList />
            </div>
        </TabsContent>
        <TabsContent value="pre-generated" className="mt-6">
            <div className="flex justify-center">
                <PreGeneratedCodes />
            </div>
        </TabsContent>
        <TabsContent value="ai-suggester" className="mt-6">
          <div className="flex justify-center">
            <AiSuggester />
          </div>
        </TabsContent>
      </Tabs>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AttendEase. All rights reserved.</p>
      </footer>
    </main>
  );
}
