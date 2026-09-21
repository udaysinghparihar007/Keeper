import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { requireEntitlement } from "@/lib/entitlements";
import prisma from "@/lib/prisma";

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    await requireEntitlement(userId, "canExportNotes");
  } catch {
    return NextResponse.json(
      { error: "Pro subscription required", code: "PRO_ENTITLEMENT_REQUIRED" },
      { status: 403 },
    );
  }

  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { title: true, content: true, createdAt: true, updatedAt: true },
  });
  const csv = [
    "Title,Content,Created At,Updated At",
    ...notes.map((note) =>
      [
        escapeCsv(note.title),
        escapeCsv(note.content),
        escapeCsv(note.createdAt.toISOString()),
        escapeCsv(note.updatedAt.toISOString()),
      ].join(","),
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="keeper-notes.csv"',
    },
  });
}
