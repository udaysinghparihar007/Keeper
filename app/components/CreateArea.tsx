"use client";

import React, { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import type { NoteInput } from "@/types/note";

interface CreateAreaProps {
  onAdd: (note: NoteInput) => void | Promise<void>;
}

export default function CreateArea({ onAdd }: CreateAreaProps) {
  const [note, setNote] = useState<NoteInput>({ title: "", content: "" });
  function submitNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.title.trim() && !note.content.trim()) return;
    void onAdd(note);
    setNote({ title: "", content: "" });
  }

  return (
    <form className="create-note" onSubmit={submitNote}>
      <input
        name="title"
        aria-label="Note title"
        value={note.title}
        onChange={(event) => setNote({ ...note, title: event.target.value })}
        placeholder="Title"
      />
      <textarea
        name="content"
        aria-label="Note content"
        value={note.content}
        onChange={(event) => setNote({ ...note, content: event.target.value })}
        placeholder="Start writing..."
        rows={4}
      />
      <button type="submit">
        <AddIcon fontSize="small" /> Add note
      </button>
    </form>
  );
}
