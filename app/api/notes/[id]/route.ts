import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import {
  MAX_NOTE_CONTENT_LENGTH,
  MAX_NOTE_TITLE_LENGTH,
} from "@/lib/note-config";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

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

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  const input = validateNoteInput(await request.json());
  if (!input) {
    return NextResponse.json({ error: "Invalid note" }, { status: 400 });
  }

  const existingNote = await prisma.note.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existingNote) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const note = await prisma.note.update({
    where: { id },
    data: input,
  });

  return NextResponse.json(note);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await prisma.note.deleteMany({
    where: { id, userId },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
