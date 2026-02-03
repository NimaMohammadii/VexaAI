import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

const SESSION_NAME = "vexa_session";

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
};

export type SessionPayload = {
  userId: string;
  role: UserRole;
};

export const createSession = async (payload: SessionPayload) => {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  cookies().set(SESSION_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
};

export const clearSession = () => {
  cookies().set(SESSION_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
};

export const readSession = async () => {
  const token = cookies().get(SESSION_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.userId || !payload.role) {
      return null;
    }
    return { userId: String(payload.userId), role: payload.role as UserRole };
  } catch (error) {
    return null;
  }
};
