"use client";

import React, { useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import type { NoteInput, NoteItem } from "@/types/note";

interface NoteProps {
  note: NoteItem;
  onUpdate: (id: string, input: NoteInput) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export default function Note({ note, onUpdate, onDelete }: NoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<NoteInput>({
    title: note.title,
    content: note.content,
  });

  function handleSave() {
    if (!draft.title.trim() && !draft.content.trim()) return;
    void onUpdate(note.id, draft);
    setIsEditing(false);
  }

  return (
    <article className="note">
      {isEditing ? (
        <>
          <input
            aria-label="Note title"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
          <textarea
            aria-label="Note content"
            value={draft.content}
            onChange={(event) => setDraft({ ...draft, content: event.target.value })}
          />
          <div className="note-actions">
            <button className="icon-button" aria-label="Save note" onClick={handleSave}>
              <SaveIcon fontSize="small" />
            </button>
            <button
              className="icon-button"
              aria-label="Cancel editing"
              onClick={() => setIsEditing(false)}
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>
        </>
      ) : (
        <>
          <h1>{note.title || "Untitled note"}</h1>
          <p>{note.content}</p>
          <div className="note-actions">
            <button className="icon-button" aria-label="Edit note" onClick={() => setIsEditing(true)}>
              <EditIcon fontSize="small" />
            </button>
            <button
              className="icon-button"
              aria-label="Delete note"
              onClick={() => void onDelete(note.id)}
            >
              <DeleteIcon fontSize="small" />
            </button>
          </div>
        </>
      )}
    </article>
  );
}
