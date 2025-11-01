// Predefined avatar options for participants
export const avatarOptions = [
  { id: 1, emoji: "⚽", color: "#667eea" },
  { id: 2, emoji: "🎮", color: "#764ba2" },
  { id: 3, emoji: "🏆", color: "#f59e0b" },
  { id: 4, emoji: "⭐", color: "#10b981" },
  { id: 5, emoji: "🔥", color: "#ef4444" },
  { id: 6, emoji: "👑", color: "#8b5cf6" },
  { id: 7, emoji: "💎", color: "#06b6d4" },
  { id: 8, emoji: "🎯", color: "#ec4899" },
  { id: 9, emoji: "🚀", color: "#6366f1" },
  { id: 10, emoji: "⚡", color: "#eab308" },
  { id: 11, emoji: "🏅", color: "#14b8a6" },
  { id: 12, emoji: "🎪", color: "#a855f7" },
  { id: 13, emoji: "🌟", color: "#f97316" },
  { id: 14, emoji: "💪", color: "#84cc16" },
  { id: 15, emoji: "🎲", color: "#0ea5e9" },
  { id: 16, emoji: "🎨", color: "#f43f5e" },
];

// Generate avatar based on initials
export const generateInitialsAvatar = (name) => {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "#667eea",
    "#764ba2",
    "#f59e0b",
    "#10b981",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
  ];

  const colorIndex = name.length % colors.length;
  const color = colors[colorIndex];

  return { initials, color };
};
