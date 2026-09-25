"use client";

import React, { useRef, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import type { NoteInput } from "@/types/note";

interface CreateAreaProps {
  onAdd: (note: NoteInput) => void | Promise<void>;
}

export default function CreateArea({ onAdd }: CreateAreaProps) {
  const [note, setNote] = useState<NoteInput>({ title: "", content: "" });
  const [isExpanded, setIsExpanded] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const hasDraft = Boolean(note.title.trim() || note.content.trim());

  function expandComposer() {
    setIsExpanded(true);
  }

  function handleComposerClick() {
    if (!isExpanded) {
      expandComposer();
      requestAnimationFrame(() => titleRef.current?.focus());
    }
  }

  function collapseWhenEmpty(event: React.FocusEvent<HTMLFormElement>) {
    if (!event.currentTarget.contains(event.relatedTarget) && !hasDraft) {
      setIsExpanded(false);
    }
  }

  function submitNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.title.trim() && !note.content.trim()) return;
    void onAdd(note);
    setNote({ title: "", content: "" });
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsExpanded(false);
  }

  return (
    <form
      className={`create-note${isExpanded ? " is-expanded" : ""}`}
      onSubmit={submitNote}
      onFocus={expandComposer}
      onBlur={collapseWhenEmpty}
      onClick={handleComposerClick}
    >
      <input
        className="create-note-title"
        ref={titleRef}
        name="title"
        aria-label="Note title"
        value={note.title}
        onChange={(event) => setNote({ ...note, title: event.target.value })}
        placeholder="Title"
        tabIndex={isExpanded ? 0 : -1}
      />
      <textarea
        name="content"
        aria-label="Note content"
        value={note.content}
        onChange={(event) => setNote({ ...note, content: event.target.value })}
        placeholder={isExpanded ? "Start writing…" : "Start a new note…"}
        rows={1}
      />
      <div className="create-note-footer">
        <span className="composer-hint">Your note stays private to this workspace.</span>
        <button type="submit" tabIndex={isExpanded ? 0 : -1}>
          <AddIcon fontSize="small" /> Add note
        </button>
      </div>
    </form>
  );
}
