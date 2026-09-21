import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import {
  MAX_GUEST_NOTES,
  MAX_NOTE_CONTENT_LENGTH,
  MAX_NOTE_TITLE_LENGTH,
} from "@/lib/note-config";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ImportNote = { title?: unknown; content?: unknown };

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json()) as { notes?: unknown };
  if (!Array.isArray(body.notes) || body.notes.length > MAX_GUEST_NOTES) {
    return NextResponse.json({ error: "Invalid note collection" }, { status: 400 });
  }

  const notes = body.notes.flatMap((candidate: ImportNote) => {
    if (
      typeof candidate?.title !== "string" ||
      typeof candidate?.content !== "string"
    ) {
      return [];
    }

    const title = candidate.title.trim();
    const content = candidate.content.trim();
    if (
      (!title && !content) ||
      title.length > MAX_NOTE_TITLE_LENGTH ||
      content.length > MAX_NOTE_CONTENT_LENGTH
    ) {
      return [];
    }

    return [{ title, content, userId }];
  });

  if (notes.length !== body.notes.length) {
    return NextResponse.json({ error: "One or more notes are invalid" }, { status: 400 });
  }

  await prisma.note.createMany({ data: notes });
  return NextResponse.json({ imported: notes.length });
}
