/** Derive up to two uppercase initials from a display name. */
export function getUserInitials(name?: string | null, fallback = 'U'): string {
  if (!name?.trim()) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
