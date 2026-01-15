
const SALT = process.env.NEXT_PUBLIC_ALIAS_SALT || "default_salt_value";

/**
 * Creates a simple hash of an alias for verification
 */
export async function createAliasHash(alias: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(alias + SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Stores alias and its hash in cookies
 */
export async function setGuestAliasCookie(alias: string) {
  const hash = await createAliasHash(alias);
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days expiration
  
  document.cookie = `guest_alias=${alias}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  document.cookie = `guest_hash=${hash}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

/**
 * Gets guest alias from cookies if hash is valid
 */
export async function getGuestAliasFromCookie(): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';').reduce((acc: any, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {});

  const alias = cookies['guest_alias'];
  const hash = cookies['guest_hash'];

  if (!alias || !hash) return null;

  const expectedHash = await createAliasHash(alias);
  if (hash === expectedHash) {
    return alias;
  }

  return null;
}

/**
 * Clears guest cookies
 */
export function clearGuestCookies() {
  document.cookie = "guest_alias=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "guest_hash=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
