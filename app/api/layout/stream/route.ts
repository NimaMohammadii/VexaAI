import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

const createEvent = (data: unknown) =>
  encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

export async function GET() {
  let lastUpdated: Date | null = null;
  let intervalId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const sendLayout = async () => {
        const layout = await prisma.layout.findUnique({ where: { name: "studio" } });
        if (!layout) {
          return;
        }

        if (!lastUpdated || layout.updatedAt > lastUpdated) {
          lastUpdated = layout.updatedAt;
          controller.enqueue(createEvent(layout.json));
        }
      };

      intervalId = setInterval(sendLayout, 3000);
      await sendLayout();
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
