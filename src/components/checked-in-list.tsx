
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getCheckedInMembersAction, checkInMemberByIdAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserCheck, Users, Loader, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

const formSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required.'),
});

type FormValues = z.infer<typeof formSchema>;


export function CheckedInList() {
  const [checkedInMembers, setCheckedInMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: '',
    },
  });

  const fetchMembers = async () => {
    try {
      const members = await getCheckedInMembersAction();
      setCheckedInMembers(members.sort());
    } catch (error) {
      console.error('Failed to fetch checked-in members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    const intervalId = setInterval(fetchMembers, 3000); // Refresh every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await checkInMemberByIdAction(values.memberId);
      if (result.success) {
        toast({
          title: 'Check-in Successful',
          description: result.message,
        });
        form.reset();
        await fetchMembers(); // Refresh list immediately
      } else {
        toast({
          variant: 'destructive',
          title: 'Check-in Failed',
          description: result.message,
        });
      }
    });
  };

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2 mb-4">
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder="Enter Member ID to check-in" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader className="animate-spin" /> : <UserCheck />}
              <span className="sr-only">Check-in</span>
            </Button>
          </form>
        </Form>

        <Separator className="mb-4" />
        
        {isLoading ? (
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
                  <p className="text-sm text-center">Scan a member's QR code or use the form above.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
