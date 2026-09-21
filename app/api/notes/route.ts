import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import {
  MAX_NOTE_CONTENT_LENGTH,
  MAX_NOTE_TITLE_LENGTH,
} from "@/lib/note-config";
import { authOptions } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import prisma from "@/lib/prisma";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

function validateNoteInput(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const input = body as { title?: unknown; content?: unknown };
  if (typeof input.title !== "string" || typeof input.content !== "string") {
    return null;
  }

  const title = input.title.trim();
  const content = input.content.trim();
  if (
    !title &&
    !content ||
    title.length > MAX_NOTE_TITLE_LENGTH ||
    content.length > MAX_NOTE_CONTENT_LENGTH
  ) {
    return null;
  }

  return { title, content };
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const input = validateNoteInput(await request.json());
  if (!input) {
    return NextResponse.json({ error: "Invalid note" }, { status: 400 });
  }

  const entitlements = await getEntitlements(userId);
  const noteCount = await prisma.note.count({ where: { userId } });
  if (noteCount >= entitlements.maxNotes) {
    return NextResponse.json(
      { error: "Note limit reached", code: "NOTE_LIMIT_REACHED" },
      { status: 403 },
    );
  }

  const note = await prisma.note.create({
    data: { ...input, userId },
  });

  return NextResponse.json(note, { status: 201 });
}
