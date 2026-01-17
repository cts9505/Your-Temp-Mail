/**
 * Converts a date to IST (Indian Standard Time, UTC+5:30)
 */
export function toIST(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  return new Date(d.getTime() + istOffset);
}

/**
 * Formats a date to IST timezone string
 */
export function formatToIST(date: Date | string, formatStr?: string): string {
  const istDate = toIST(date);
  return istDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

/**
 * Gets current IST time
 */
export function getCurrentIST(): Date {
  return toIST(new Date());
}

/**
 * Extracts sender name from email address
 * Example: "OpenAI" <otp@tm1.openai.com> -> OpenAI
 * Example: otp@tm1.openai.com -> otp
 */
export function extractSenderName(sender: string): string {
  // Check if it's in format: "Name" <email@domain.com>
  const nameMatch = sender.match(/"([^"]+)"/);
  if (nameMatch) {
    return nameMatch[1];
  }
  
  // Check if it's in format: Name <email@domain.com>
  const bracketMatch = sender.match(/^([^<]+)\s*</);
  if (bracketMatch) {
    return bracketMatch[1].trim();
  }
  
  // Just email address - return the part before @
  return sender.split('@')[0];
}
