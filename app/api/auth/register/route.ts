import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const defaultCredits = Number(process.env.DEFAULT_CREDITS ?? "500");
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const role = adminEmail && adminEmail === email.toLowerCase() ? "ADMIN" : "USER";

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      credits: defaultCredits,
      role
    }
  });

  await createSession({ userId: user.id, role: user.role });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    credits: user.credits,
    role: user.role
  });
}
