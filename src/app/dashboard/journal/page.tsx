"use client"

import { useState } from "react";
import JournalForm from "@/components/journal/journal-form";
import JournalHistory from "@/components/journal/journal-history";
import JournalEditDialog from "@/components/journal/journal-edit-dialog";

interface JournalEntry {
  id: number;
  description: string;
  start_timestamp: string;
  properties: {
    type: string;
    word_count: number;
  };
}

export default function JournalPage() {
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingEntry(null);
  };

  const handleSaveEdit = () => {
    setRefreshKey(prev => prev + 1); // Trigger refresh of history
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Daily Journal</h1>
        <p className="text-white/70">
          Record your thoughts, feelings, and daily experiences
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <JournalForm />
        </div>
        <div>
          <JournalHistory 
            key={refreshKey}
            onEditEntry={handleEditEntry} 
          />
        </div>
      </div>

      <JournalEditDialog
        entry={editingEntry}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
