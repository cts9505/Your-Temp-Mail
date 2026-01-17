
const SALT = process.env.NEXT_PUBLIC_ALIAS_SALT || "default_salt_value";

/**
 * Encrypts alias using XOR with SALT-derived key
 */
function encryptAlias(alias: string): string {
  try {
    console.log("🔐 Encrypting alias:", alias);
    const key = SALT.repeat(Math.ceil(alias.length / SALT.length)).slice(0, alias.length);
    const encrypted = alias.split('').map((char, i) => 
      char.charCodeAt(0) ^ key.charCodeAt(i)
    );
    // Use encodeURIComponent to handle special characters in cookie
    const result = encodeURIComponent(btoa(String.fromCharCode(...encrypted)));
    console.log("🔐 Encrypted result:", result);
    return result;
  } catch (error) {
    console.error("❌ Encryption failed:", error);
    // Fallback: return base64 encoded alias
    return btoa(alias);
  }
}

/**
 * Decrypts alias using XOR with SALT-derived key
 */
function decryptAlias(encrypted: string): string | null {
  try {
    console.log("🔓 Attempting to decrypt:", encrypted);
    // Decode URI component first
    const decoded = atob(decodeURIComponent(encrypted));
    const bytes = decoded.split('').map(c => c.charCodeAt(0));
    const key = SALT.repeat(Math.ceil(bytes.length / SALT.length)).slice(0, bytes.length);
    const decrypted = bytes.map((byte, i) => 
      String.fromCharCode(byte ^ key.charCodeAt(i))
    );
    const result = decrypted.join('');
    console.log('🔓 Decrypted alias:', result);
    return result;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    // Try fallback: direct base64 decode
    try {
      const fallback = atob(encrypted);
      console.log('🔓 Fallback decode:', fallback);
      return fallback;
    } catch {
      return null;
    }
  }
}

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
 * Stores encrypted alias and its hash in cookies
 */
export async function setGuestAliasCookie(alias: string) {
  console.log("🍪 Setting guest alias cookie for:", alias);
  const encrypted = encryptAlias(alias);
  const hash = await createAliasHash(alias);
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days expiration
  
  document.cookie = `guest_alias=${encrypted}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  document.cookie = `guest_hash=${hash}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  console.log("🍪 Cookies set:", { encrypted, hash: hash.substring(0, 10) + "..." });
}

/**
 * Gets guest alias from cookies if hash is valid
 */
export async function getGuestAliasFromCookie(): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  
  console.log("🍪 Reading cookies...");
  const cookies = document.cookie.split(';').reduce((acc: any, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {});

  const encryptedAlias = cookies['guest_alias'];
  const hash = cookies['guest_hash'];

  console.log("🍪 Found cookies:", { 
    hasAlias: !!encryptedAlias, 
    hasHash: !!hash,
    encryptedAlias: encryptedAlias?.substring(0, 20) + "..."
  });

  if (!encryptedAlias || !hash) {
    console.log("⚠️ Missing cookies");
    return null;
  }

  const alias = decryptAlias(encryptedAlias);
  if (!alias) {
    console.log("❌ Decryption returned null");
    return null;
  }

  const expectedHash = await createAliasHash(alias);
  if (hash === expectedHash) {
    console.log("✅ Cookie validation successful:", alias);
    return alias;
  }

  console.log("❌ Hash mismatch - cookie tampered or salt changed");
  return null;
}

/**
 * Clears guest cookies
 */
export function clearGuestCookies() {
  document.cookie = "guest_alias=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "guest_hash=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
