"use client";

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from '@/hooks/use-toast';

interface AIFeedbackProps {
  messageId: string;
  aiContent: string;
  onFeedback?: (feedback: { rating: 'positive' | 'negative'; comment?: string; reason?: string; messageId: string }) => void;
}

export function AIFeedback({ messageId, aiContent, onFeedback }: AIFeedbackProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState<string>('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = (newRating: 'positive' | 'negative') => {
    // If clicking the same rating, unselect it
    if (rating === newRating) {
      setRating(null);
      return;
    }

    setRating(newRating);

    // If positive, just submit immediately (users rarely leave comments for good stuff)
    if (newRating === 'positive') {
      if (onFeedback) {
        onFeedback({ rating: 'positive', messageId });
      }
      toast({
        title: "Thanks for the feedback!",
        description: "We're glad this was helpful.",
      });
    } else {
      // If negative, open dialog to get more details
      setShowFeedbackDialog(true);
    }
  };

  const submitNegativeFeedback = () => {
    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      if (onFeedback) {
        onFeedback({ 
          rating: 'negative', 
          reason: feedbackReason, 
          comment: feedbackComment, 
          messageId 
        });
      }
      
      setIsSubmitting(false);
      setShowFeedbackDialog(false);
      setFeedbackReason('');
      setFeedbackComment('');
      
      toast({
        title: "Feedback received",
        description: "We'll use this to improve future responses.",
      });
    }, 500);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 rounded-md hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 dark:hover:text-green-400 transition-colors",
            rating === 'positive' && "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400"
          )}
          onClick={() => handleRating('positive')}
          title="Helpful"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 rounded-md hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors",
            rating === 'negative' && "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400"
          )}
          onClick={() => handleRating('negative')}
          title="Not helpful"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={showFeedbackDialog} onOpenChange={(open) => {
        if (!open) {
          // If closing without submitting, reset rating if it was negative
          if (rating === 'negative' && !isSubmitting) {
            setRating(null);
          }
        }
        setShowFeedbackDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>How can we improve?</DialogTitle>
            <DialogDescription>
              Your feedback helps us train our AI to be better.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <RadioGroup value={feedbackReason} onValueChange={setFeedbackReason}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inaccurate" id="inaccurate" />
                <Label htmlFor="inaccurate">Inaccurate information</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="too-vague" id="too-vague" />
                <Label htmlFor="too-vague">Too vague or generic</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="irrelevant" id="irrelevant" />
                <Label htmlFor="irrelevant">Irrelevant to my question</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="formatting" id="formatting" />
                <Label htmlFor="formatting">Formatting issues</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="comment">Additional comments (optional)</Label>
              <Textarea
                id="comment"
                placeholder="Tell us more about what went wrong..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitNegativeFeedback} 
              disabled={!feedbackReason || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
