export const calculateCredits = (text: string) => {
  const perThousand = Number(process.env.CREDITS_PER_1000 ?? "1");
  const characters = text.trim().length;
  const credits = Math.max(1, Math.ceil((characters / 1000) * perThousand));
  return { characters, credits };
};
