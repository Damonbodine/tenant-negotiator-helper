
export const tips = [
  "Ask for 1–2 months free instead of lowering base rent; landlords prefer headline rent intact.",
  "Offer to sign a longer lease in exchange for a lower monthly rate.",
  "Ask if utilities or parking can be bundled to lower your effective cost.",
  "Use recent comparable listings as leverage—same building, lower price.",
  "If the unit's been vacant >30 days, emphasize carrying costs to justify your offer."
];

export function randomTip(): string {
  return tips[Math.floor(Math.random() * tips.length)];
}
