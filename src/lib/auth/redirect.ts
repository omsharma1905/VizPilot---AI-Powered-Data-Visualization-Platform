/**
 * Validates and sanitizes redirect destination paths to prevent open-redirect vulnerabilities.
 */
export function getSafeRedirectUrl(
  candidate: string | null | undefined,
  fallback: string = '/upload'
): string {
  if (!candidate || typeof candidate !== 'string') {
    return fallback;
  }

  const trimmed = candidate.trim();

  // Must start with '/' but not '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Reject backslashes anywhere in path
  if (trimmed.includes('\\')) {
    return fallback;
  }

  // Reject common URI scheme attacks (javascript:, http:, https:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  // Reject carriage returns or newlines (header injection defense)
  if (/[\r\n]/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
