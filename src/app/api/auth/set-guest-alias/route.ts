import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SALT = process.env.ALIAS_SALT || "default_salt_value";

function encryptAlias(alias: string): string {
  const key = SALT.repeat(Math.ceil(alias.length / SALT.length)).slice(0, alias.length);
  const encrypted = alias.split('').map((char, i) => 
    char.charCodeAt(0) ^ key.charCodeAt(i)
  );
  return Buffer.from(encrypted).toString('base64');
}

async function createAliasHash(alias: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(alias + SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: NextRequest) {
  try {
    const { alias } = await request.json();

    if (!alias || typeof alias !== 'string') {
      return NextResponse.json({ error: "Invalid alias" }, { status: 400 });
    }

    const encrypted = encryptAlias(alias);
    const hash = await createAliasHash(alias);

    const cookieStore = await cookies();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    cookieStore.set('guest_alias', encrypted, {
      path: '/',
      expires,
      httpOnly: true, // Prevents JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    cookieStore.set('guest_hash', hash, {
      path: '/',
      expires,
      httpOnly: false, // Can be read by client for validation
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting guest alias:", error);
    return NextResponse.json({ error: "Failed to set alias" }, { status: 500 });
  }
}
