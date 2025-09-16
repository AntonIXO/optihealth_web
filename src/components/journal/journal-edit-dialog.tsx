"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface JournalEntry {
  id: number;
  description: string;
  start_timestamp: string;
  properties: {
    type: string;
    word_count: number;
  };
}

interface JournalEditDialogProps {
  entry: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function JournalEditDialog({ entry, isOpen, onClose, onSave }: JournalEditDialogProps) {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (entry) {
      setDescription(entry.description);
    } else {
      setDescription("");
    }
  }, [entry]);

  const handleSave = async () => {
    if (!entry || !description.trim()) {
      toast.error("Please write something in your journal entry");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('events')
        .update({
          description: description.trim(),
          properties: {
            type: 'journal_entry',
            word_count: description.trim().split(/\s+/).length
          }
        })
        .eq('id', entry.id);

      if (error) {
        console.error('Error updating journal entry:', error);
        toast.error("Failed to update journal entry");
        return;
      }

      toast.success("Journal entry updated successfully!");
      onSave();
      onClose();
      
    } catch (error) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Journal Entry</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-entry" className="text-white/90">
              Update your journal entry
            </Label>
            <Textarea
              id="edit-entry"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write about your day, thoughts, feelings, or anything that comes to mind..."
              className="mt-2 min-h-[200px] bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/60">
              {description.trim() ? `${description.trim().split(/\s+/).length} words` : "0 words"}
            </span>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !description.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
