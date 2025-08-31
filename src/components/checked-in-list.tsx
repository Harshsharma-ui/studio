
'use client';

import { useState, useEffect } from 'react';
import { getCheckedInMembersAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserCheck, Users, Loader } from 'lucide-react';
import { Badge } from './ui/badge';

export function CheckedInList() {
  const [checkedInMembers, setCheckedInMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const members = await getCheckedInMembersAction();
        setCheckedInMembers(members);
      } catch (error) {
        console.error('Failed to fetch checked-in members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
    const intervalId = setInterval(fetchMembers, 3000); // Refresh every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="text-primary" />
          Checked-in Members
        </CardTitle>
        <CardDescription className="flex justify-between items-center">
          A real-time list of members who have been scanned in.
          <Badge variant="secondary">{checkedInMembers.length} Total</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader className="mr-2 h-5 w-5 animate-spin" />
            <span>Loading members...</span>
          </div>
        ) : (
          <ScrollArea className="h-72 w-full rounded-md border">
            <div className="p-4">
              {checkedInMembers.length > 0 ? (
                <ul className="space-y-3">
                  {checkedInMembers.map((memberId, index) => (
                    <li key={index} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-md">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-foreground">{memberId}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-16">
                  <Users className="h-10 w-10 mb-2" />
                  <p className="font-semibold">No one has checked in yet.</p>
                  <p className="text-sm text-center">Scan a member's QR code to see them appear here.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
