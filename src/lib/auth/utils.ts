/**
 * Utility functions for user profile display formatting.
 */

export function getUserInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') {
    return 'U';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getFirstName(name?: string | null): string {
  if (!name || typeof name !== 'string') {
    return 'User';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts[0] || 'User';
}
