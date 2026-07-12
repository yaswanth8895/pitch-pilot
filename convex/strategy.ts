export function cleanStrategy(content: string) {
  const strategy = content.trim();
  if (!strategy) {
    throw new Error("Hermes returned an empty strategy.");
  }
  return strategy;
}
