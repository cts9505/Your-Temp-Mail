import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a unique temporary alias using timestamp and random characters
 * Format: <random><timestamp>
 * Example: a7x9k2301 (5 random chars + 4 digit timestamp)
 */
export function generateUniqueTempAlias(): string {
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let random = "";
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${random}${timestamp}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  // Try navigator.clipboard first
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Navigator clipboard failed, trying fallback", err);
    }
  }

  // Fallback: Create a temporary textarea
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure textarea is not visible but part of the document
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error("Fallback clipboard copy failed", err);
    return false;
  }
}
