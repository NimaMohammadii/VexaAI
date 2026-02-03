import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateCredits } from "@/lib/credits";
import { synthesizeSpeech } from "@/lib/elevenlabs";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text, voiceId } = await request.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const { characters, credits } = calculateCredits(text);
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.credits < credits) {
    return NextResponse.json(
      { error: "Insufficient credits" },
      { status: 402 }
    );
  }

  const targetVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID;
  if (!targetVoiceId) {
    return NextResponse.json(
      { error: "No ElevenLabs voice configured" },
      { status: 400 }
    );
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: user.id },
      data: { credits: { decrement: credits } }
    });

    await tx.ttsRequest.create({
      data: {
        userId: user.id,
        text,
        characters,
        creditsUsed: credits,
        voiceId: targetVoiceId
      }
    });

    return updated;
  });

  try {
    const audioBuffer = await synthesizeSpeech({
      text,
      voiceId: targetVoiceId
    });

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "x-credits-remaining": String(updatedUser.credits)
      }
    });
  } catch (error) {
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { increment: credits } }
    });

    return NextResponse.json(
      { error: "Failed to synthesize audio" },
      { status: 502 }
    );
  }
}
