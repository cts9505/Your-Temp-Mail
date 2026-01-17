/**
 * Client-side auth utilities for guest alias management
 * SECURITY: Salt is now server-side only, cookies are HttpOnly
 */

/**
 * Stores guest alias securely via server-side API
 */
export async function setGuestAliasCookie(alias: string) {
  console.log("🍪 Setting guest alias cookie for:", alias);
  try {
    const response = await fetch('/api/auth/set-guest-alias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias })
    });

    if (!response.ok) {
      throw new Error('Failed to set guest alias');
    }

    console.log("🍪 Cookies set successfully via API");
    return true;
  } catch (error) {
    console.error("❌ Failed to set guest alias cookie:", error);
    return false;
  }
}

/**
 * Gets guest alias from server-side cookie validation
 */
export async function getGuestAliasFromCookie(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  console.log("🍪 Fetching guest alias from API...");
  try {
    const response = await fetch('/api/auth/get-guest-alias');
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    console.log("🍪 Received alias:", data.alias);
    return data.alias;
  } catch (error) {
    console.error("❌ Failed to get guest alias:", error);
    return null;
  }
}

/**
 * Clears guest cookies
 */
export function clearGuestCookies() {
  document.cookie = "guest_alias=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "guest_hash=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
