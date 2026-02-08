import type { ProfileData } from "../context/WaltzStore";

// Generate icebreaker prompts based on shared interests between two profiles
export function getIcebreakers(myProfile: ProfileData | null, otherProfile: ProfileData): string[] {
  const prompts: string[] = [];

  // Same section
  if (myProfile?.section && otherProfile.section && myProfile.section === otherProfile.section) {
    prompts.push(`We're both in Section ${otherProfile.section} — have we met? 🤔`);
  }

  // Same program
  if (myProfile?.batch === otherProfile.batch) {
    prompts.push(`Fellow ${otherProfile.batch} — which prof do you tolerate the most?`);
  }

  // Red flag
  if (otherProfile.redFlag) {
    prompts.push(`"${otherProfile.redFlag}" — explain yourself. 🚩`);
  }

  // Trip
  if (otherProfile.favoriteTrip) {
    prompts.push(`${otherProfile.favoriteTrip} — take me there next time?`);
  }

  // Party spot
  if (otherProfile.partySpot) {
    prompts.push(`${otherProfile.partySpot} this weekend?`);
  }

  // Maggi metric similarity
  if (myProfile && Math.abs(myProfile.maggiMetric - otherProfile.maggiMetric) < 15) {
    prompts.push("Our Maggi vibes are aligned — late-night noodle plans? 🍜");
  }

  // High compatibility
  if (otherProfile.compatibility >= 80) {
    prompts.push(`${otherProfile.compatibility}% match — the algorithm ships us. Do you? 💫`);
  }

  // Generic fallbacks
  const fallbacks = [
    "If you had to describe yourself in one red flag, what would it be?",
    "Hot take: the mess food is actually fine. Agree or disagree?",
    "What's the one class you'd skip for a Waltz date?",
    "Mountains or music: what made you choose Shillong?",
  ];

  // Fill to at least 3
  while (prompts.length < 3 && fallbacks.length > 0) {
    prompts.push(fallbacks.shift()!);
  }

  return prompts.slice(0, 4);
}
