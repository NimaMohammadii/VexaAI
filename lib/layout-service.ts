import { prisma } from "@/lib/db";
import { defaultLayout, type StudioLayout } from "@/lib/layout";

export const getOrCreateLayout = async () => {
  const existing = await prisma.layout.findUnique({ where: { name: "studio" } });
  if (existing) {
    return existing.json as StudioLayout;
  }

  const created = await prisma.layout.create({
    data: {
      name: "studio",
      json: defaultLayout
    }
  });

  return created.json as StudioLayout;
};
