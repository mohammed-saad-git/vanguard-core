import { PriorityLevel } from "./config";

export interface PriorityBadge {
  label: string;
  /** Tailwind utility classes for the priority pill. */
  className: string;
}

const PRIORITY_BADGES: Record<number, PriorityBadge> = {
  1: {
    label: "1 - Critical Emergency",
    className: "bg-red-500/20 text-red-400 border-red-500/50 ring-2 ring-red-500/20"
  },
  2: {
    label: "2 - High Hazard",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/50"
  },
  3: {
    label: "3 - Medium Risk",
    className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
  },
  4: {
    label: "4 - Routine Inconvenience",
    className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
  }
};

const DEFAULT_BADGE: PriorityBadge = PRIORITY_BADGES[4];

/** Returns the human-readable label for a numeric priority level. */
export function getPriorityLabel(priority: number): string {
  return (PRIORITY_BADGES[priority] ?? DEFAULT_BADGE).label;
}

/** Returns Tailwind classes used to render the coloured priority pill. */
export function getPriorityBadgeClass(priority: number): string {
  return (PRIORITY_BADGES[priority] ?? DEFAULT_BADGE).className;
}

/** Strongly-typed accessor for callers that already hold a typed PriorityLevel. */
export function getPriorityBadgeTyped(priority: PriorityLevel): PriorityBadge {
  return PRIORITY_BADGES[priority] ?? DEFAULT_BADGE;
}
