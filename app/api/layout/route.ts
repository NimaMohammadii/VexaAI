import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { defaultLayout, type StudioLayout } from "@/lib/layout";

export async function GET() {
  const layout = await prisma.layout.findUnique({ where: { name: "studio" } });
  return NextResponse.json(layout?.json ?? defaultLayout);
}

export async function PUT(request: Request) {
  const session = await readSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = (await request.json()) as StudioLayout;
  if (!payload?.sections) {
    return NextResponse.json({ error: "Invalid layout payload" }, { status: 400 });
  }

  const updated = await prisma.layout.upsert({
    where: { name: "studio" },
    update: { json: payload },
    create: { name: "studio", json: payload }
  });

  return NextResponse.json(updated.json);
}
