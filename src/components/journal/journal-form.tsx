"use client"

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function JournalForm() {
  const [entry, setEntry] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entry.trim()) {
      toast.error("Please write something in your journal entry");
      return;
    }

    setIsLoading(true);

    // Get current user ID
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      throw new Error("Not authenticated")
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            user_id: user.id,
            event_name: 'mental_health_log',
            start_timestamp: new Date().toISOString(),
            description: entry.trim(),
            properties: {
              type: 'journal_entry',
              word_count: entry.trim().split(/\s+/).length
            }
          }
        ])
        .select();

      if (error) {
        console.error('Error saving journal entry:', error);
        toast.error("Failed to save journal entry");
        return;
      }

      toast.success("Journal entry saved successfully!");
      setEntry("");
      
      // Trigger a refresh of the journal history
      window.dispatchEvent(new CustomEvent('journalEntryAdded'));
      
    } catch (error) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/10 border-white/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          New Journal Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="entry" className="text-white/90">
              How are you feeling today? What's on your mind?
            </Label>
            <Textarea
              id="entry"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Write about your day, thoughts, feelings, or anything that comes to mind..."
              className="mt-2 min-h-[200px] bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/60">
              {entry.trim() ? `${entry.trim().split(/\s+/).length} words` : "0 words"}
            </span>
            
            <Button
              type="submit"
              disabled={isLoading || !entry.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Save Entry
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
