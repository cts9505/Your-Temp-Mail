import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SALT = process.env.ALIAS_SALT || "default_salt_value";

function decryptAlias(encrypted: string): string | null {
  try {
    const bytes = Buffer.from(encrypted, 'base64');
    const key = SALT.repeat(Math.ceil(bytes.length / SALT.length)).slice(0, bytes.length);
    const decrypted = Array.from(bytes).map((byte, i) => 
      String.fromCharCode(byte ^ key.charCodeAt(i))
    );
    return decrypted.join('');
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

async function createAliasHash(alias: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(alias + SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const encryptedAlias = cookieStore.get('guest_alias')?.value;
    const hash = cookieStore.get('guest_hash')?.value;

    if (!encryptedAlias || !hash) {
      return NextResponse.json({ alias: null }, { status: 200 });
    }

    const decrypted = decryptAlias(encryptedAlias);
    
    if (!decrypted) {
      return NextResponse.json({ alias: null }, { status: 200 });
    }

    // Verify hash
    const expectedHash = await createAliasHash(decrypted);
    if (hash !== expectedHash) {
      console.warn("Hash mismatch - possible tampering");
      return NextResponse.json({ alias: null }, { status: 200 });
    }

    return NextResponse.json({ alias: decrypted }, { status: 200 });
  } catch (error) {
    console.error("Error getting guest alias:", error);
    return NextResponse.json({ error: "Failed to get alias" }, { status: 500 });
  }
}
