"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BookOpen, Calendar, Clock, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import DeleteConfirmationDialog from "./delete-confirmation-dialog";

interface JournalEntry {
  id: number;
  description: string;
  start_timestamp: string;
  properties: {
    type: string;
    word_count: number;
  };
}

interface JournalHistoryProps {
  onEditEntry?: (entry: JournalEntry) => void;
}

export default function JournalHistory({ onEditEntry }: JournalHistoryProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, description, start_timestamp, properties')
        .eq('event_name', 'mental_health_log')
        .order('start_timestamp', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching journal entries:', error);
        return;
      }

      setEntries(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteEntryId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', deleteEntryId);

      if (error) {
        console.error('Error deleting journal entry:', error);
        toast.error("Failed to delete journal entry");
        return;
      }

      toast.success("Journal entry deleted successfully!");
      fetchEntries(); // Refresh the list
      setDeleteEntryId(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (entryId: number) => {
    setDeleteEntryId(entryId);
  };

  useEffect(() => {
    fetchEntries();

    // Listen for new journal entries
    const handleNewEntry = () => {
      fetchEntries();
    };

    window.addEventListener('journalEntryAdded', handleNewEntry);

    return () => {
      window.removeEventListener('journalEntryAdded', handleNewEntry);
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-white/10 border-white/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Recent Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-16 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 border-white/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Recent Entries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">No journal entries yet</p>
              <p className="text-white/40 text-sm">Start writing to see your entries here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(entry.start_timestamp), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-white/10 text-white/80 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(entry.start_timestamp), { addSuffix: true })}
                      </Badge>
                      {entry.properties?.word_count && (
                        <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                          {entry.properties.word_count} words
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-white/20">
                          <DropdownMenuItem 
                            onClick={() => onEditEntry?.(entry)}
                            className="text-white hover:bg-white/10 cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(entry.id)}
                            className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {entry.description.length > 200
                      ? `${entry.description.substring(0, 200)}...`
                      : entry.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <DeleteConfirmationDialog
        isOpen={deleteEntryId !== null}
        onClose={() => setDeleteEntryId(null)}
        onConfirm={handleDeleteEntry}
        isLoading={isDeleting}
      />
    </Card>
  );
}
