
'use client';

import { useState, useEffect, useTransition } from 'react';
import { getCheckedInMembersAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Loader, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';

export function CheckedInList() {
  const [checkedInMembers, setCheckedInMembers] = useState<string[]>([]);
  const [isLoading, startLoadingTransition] = useTransition();
  const { toast } = useToast();

  const fetchMembers = async () => {
    startLoadingTransition(async () => {
      try {
        const members = await getCheckedInMembersAction();
        setCheckedInMembers(members.sort());
      } catch (error) {
        console.error('Failed to fetch checked-in members:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to fetch checked-in members.',
        });
      }
    });
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="text-primary" />
          Checked-in Members
        </CardTitle>
        <CardDescription className="flex justify-between items-center">
          A list of members who have been scanned in.
          <Badge variant="secondary">{checkedInMembers.length} Total</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
             <Button onClick={fetchMembers} disabled={isLoading} className="w-full">
                {isLoading ? (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh List
            </Button>
        </div>
        {isLoading && checkedInMembers.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader className="mr-2 h-5 w-5 animate-spin" />
            <span>Loading members...</span>
          </div>
        ) : (
          <ScrollArea className="h-60 w-full rounded-md border">
            <div className="p-4">
              {checkedInMembers.length > 0 ? (
                <ul className="space-y-3">
                  {checkedInMembers.map((memberId, index) => (
                    <li key={index} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-md">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-foreground">{memberId}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-12">
                  <Users className="h-10 w-10 mb-2" />
                  <p className="font-semibold">No one has checked in yet.</p>
                  <p className="text-sm text-center">Scan a member's QR code to check them in.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
