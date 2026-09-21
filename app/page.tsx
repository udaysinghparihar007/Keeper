"use client";

import React, { useCallback, useEffect, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Note from "./components/Note";
import CreateArea from "./components/CreateArea";
import SavePermanentlyDialog from "./components/SavePermanentlyDialog";
import { useSession } from "next-auth/react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  GUEST_NOTES_STORAGE_KEY,
  GUEST_RETENTION_MS,
  MAX_GUEST_NOTES,
} from "@/lib/note-config";
import type { NoteInput, NoteItem } from "@/types/note";

interface GuestWorkspace {
  workspaceId: string;
  expiresAt: number;
  lastUpdatedAt: number;
  notes: NoteItem[];
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function readGuestWorkspace(): GuestWorkspace {
  const now = Date.now();
  try {
    const stored = window.localStorage.getItem(GUEST_NOTES_STORAGE_KEY);
    if (stored) {
      const workspace = JSON.parse(stored) as GuestWorkspace;
      if (workspace.expiresAt > now && Array.isArray(workspace.notes)) {
        return workspace;
      }
      window.localStorage.removeItem(GUEST_NOTES_STORAGE_KEY);
    }
  } catch {
    window.localStorage.removeItem(GUEST_NOTES_STORAGE_KEY);
  }

  return {
    workspaceId: createId(),
    expiresAt: now + GUEST_RETENTION_MS,
    lastUpdatedAt: now,
    notes: [],
  };
}

export default function Home() {
  const { data: session, status } = useSession();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [guestWorkspace, setGuestWorkspace] = useState<GuestWorkspace | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [billingPlan, setBillingPlan] = useState<"FREE" | "PRO" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const saveGuestNotes = useCallback((nextNotes: NoteItem[]) => {
    const now = Date.now();
    const workspace = guestWorkspace ?? readGuestWorkspace();
    const nextWorkspace = {
      ...workspace,
      notes: nextNotes,
      lastUpdatedAt: now,
      expiresAt: now + GUEST_RETENTION_MS,
    };
    window.localStorage.setItem(
      GUEST_NOTES_STORAGE_KEY,
      JSON.stringify(nextWorkspace),
    );
    setGuestWorkspace(nextWorkspace);
  }, [guestWorkspace]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    let cancelled = false;
    async function loadNotes() {
      if (status === "authenticated") {
        try {
          const response = await fetch("/api/notes");
          if (!response.ok) {
            throw new Error("Unable to load account notes");
          }
          const accountNotes = (await response.json()) as NoteItem[];
          if (!cancelled) {
            setNotes(accountNotes);
            setGuestWorkspace(readGuestWorkspace());
            setIsReady(true);
            void fetch("/api/billing/status")
              .then(async (billingResponse) => {
                if (billingResponse.ok) {
                  const billing = (await billingResponse.json()) as { plan: "FREE" | "PRO" };
                  setBillingPlan(billing.plan);
                }
              })
              .catch(() => setBillingPlan("FREE"));
          }
        } catch {
          if (!cancelled) {
            setMessage("Your account notes could not be loaded. Please try again.");
            setIsReady(true);
          }
        }
        return;
      }

      const workspace = readGuestWorkspace();
      if (!cancelled) {
        setGuestWorkspace(workspace);
        setNotes(workspace.notes);
        setIsReady(true);
      }
    }

    void loadNotes();
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id]);

  async function addNote(input: NoteInput) {
    if (status === "authenticated") {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        setMessage("The note could not be saved. Please try again.");
        return;
      }
      const createdNote = (await response.json()) as NoteItem;
      setNotes((current) => [createdNote, ...current]);
      return;
    }

    if (notes.length >= MAX_GUEST_NOTES) {
      setMessage("You have reached the guest note limit. Create an account to keep going.");
      return;
    }

    const now = new Date().toISOString();
    const nextNotes = [
      {
        ...input,
        id: createId(),
        createdAt: now,
        updatedAt: now,
      },
      ...notes,
    ];
    setNotes(nextNotes);
    saveGuestNotes(nextNotes);
  }

  async function updateNote(id: string, input: NoteInput) {
    if (status === "authenticated") {
      const response = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        setMessage("The note could not be updated. Please try again.");
        return;
      }
      const updatedNote = (await response.json()) as NoteItem;
      setNotes((current) =>
        current.map((note) => (note.id === id ? updatedNote : note)),
      );
      return;
    }

    const nextNotes = notes.map((note) =>
      note.id === id
        ? { ...note, ...input, updatedAt: new Date().toISOString() }
        : note,
    );
    setNotes(nextNotes);
    saveGuestNotes(nextNotes);
  }

  async function deleteNote(id: string) {
    if (status === "authenticated") {
      const response = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setMessage("The note could not be deleted. Please try again.");
        return;
      }
    }
    const nextNotes = notes.filter((note) => note.id !== id);
    setNotes(nextNotes);
    if (status !== "authenticated") {
      saveGuestNotes(nextNotes);
    }
  }

  async function migrateGuestNotes() {
    const guestNotes = guestWorkspace?.notes ?? [];
    if (!guestNotes.length) {
      return;
    }

    setIsMigrating(true);
    setMessage("");
    try {
      const response = await fetch("/api/notes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: guestNotes.map(({ title, content }) => ({ title, content })),
        }),
      });
      if (!response.ok) {
        throw new Error("Migration failed");
      }
      const notesResponse = await fetch("/api/notes");
      if (!notesResponse.ok) {
        throw new Error("Unable to refresh notes");
      }
      const accountNotes = (await notesResponse.json()) as NoteItem[];
      window.localStorage.removeItem(GUEST_NOTES_STORAGE_KEY);
      setGuestWorkspace({ ...readGuestWorkspace(), notes: [] });
      setNotes(accountNotes);
      setMessage("Your notes are now saved permanently to your account.");
    } catch {
      setMessage("Your temporary notes were kept, but migration failed. Please try again.");
    } finally {
      setIsMigrating(false);
    }
  }

  if (!isReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h5">Loading Keeper...</Typography>
      </Box>
    );
  }

  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.trim().toLowerCase();
    return !query ||
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query);
  });

  return (
    <div className="keeper-app">
      <Header
        isGuest={status !== "authenticated"}
        hasGuestNotes={Boolean(guestWorkspace?.notes.length)}
        plan={billingPlan}
        onSearch={setSearchQuery}
        onSavePermanently={() => setIsSaveDialogOpen(true)}
      />
      <main className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">Your workspace</p>
            <h1>Notes that stay with you.</h1>
            <p>Capture ideas quickly, return to what matters, and keep everything in one calm place.</p>
          </div>
        </div>
        <section className="editor-panel" aria-labelledby="create-note-heading">
          <div className="editor-heading">
            <div>
              <h2 id="create-note-heading">Capture a thought</h2>
              <p>Start writing. Keeper saves as you go.</p>
            </div>
            {status !== "authenticated" ? (
              <div className="editor-storage">
                <div className="storage-copy">
                  <span className="storage-dot" />
                  <span>Saved on this device</span>
                </div>
                <button className="text-action" onClick={() => setIsSaveDialogOpen(true)}>
                  Keep permanently
                </button>
              </div>
            ) : (
              <div className="storage-copy">
                <span className="storage-dot saved" />
                <span>Saved to Keeper</span>
              </div>
            )}
          </div>
          <CreateArea onAdd={addNote} />
        </section>
        {status === "authenticated" && Boolean(guestWorkspace?.notes.length) && (
          <div className="migration-banner">
            <div>
              <strong>Bring your device notes with you</strong>
              <p>Import them into your account without changing existing notes.</p>
            </div>
            <button
              className="auth-button primary"
              disabled={isMigrating}
              onClick={() => void migrateGuestNotes()}
            >
              {isMigrating ? "Saving..." : "Import notes"}
            </button>
          </div>
        )}
        {message && <p className="status-message" role="status">{message}</p>}
        <section aria-labelledby="notes-heading">
          <div className="notes-heading">
            <h2 id="notes-heading">{searchQuery ? "Search results" : "Your notes"}</h2>
            <span className="notes-count">{filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}</span>
          </div>
          {filteredNotes.length ? (
            <div className="notes-grid">
              {filteredNotes.map((noteItem) => (
                <Note
                  key={noteItem.id}
                  note={noteItem}
                  onUpdate={updateNote}
                  onDelete={deleteNote}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>{searchQuery ? "No notes found" : "No notes yet"}</h2>
              <p>{searchQuery ? "Try another search." : "Capture an idea before it disappears."}</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <SavePermanentlyDialog
        open={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        hasNotes={Boolean(guestWorkspace?.notes.length)}
      />
    </div>
  );
}