import { useState } from 'react';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface MeetupDescriptionDialogProps {
  eventId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeetupDescriptionDialog({
  eventId,
  open,
  onOpenChange,
}: MeetupDescriptionDialogProps) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadDescription() {
    setLoading(true);
    try {
      const res = await api.get<{ description: string }>(
        `/api/events/${eventId}/meetup-description`
      );
      setDescription(res.description);
    } catch {
      setDescription('Failed to load description');
    }
    setLoading(false);
  }

  function handleOpenChange(open: boolean) {
    if (open) {
      setCopied(false);
      loadDescription();
    }
    onOpenChange(open);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Meetup Description</DialogTitle>
          <DialogDescription>Copy this to paste into Meetup.com</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
              {description}
            </pre>
            <Button onClick={handleCopy} className="w-full">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
