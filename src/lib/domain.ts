/**
 * Get the domain name from environment variable
 * Falls back to 'yourtempmail.com' if not set
 */
export function getDomain(): string {
  return process.env.NEXT_PUBLIC_DOMAIN || 'yourtempmail.com';
}
