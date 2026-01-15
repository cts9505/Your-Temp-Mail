import { sql } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { email, password, alias } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Check if alias is taken (if provided)
    if (alias) {
      const existingAlias = await sql`
        SELECT id FROM users WHERE alias = ${alias.toLowerCase()}
      `;
      if (existingAlias.length > 0) {
        return NextResponse.json({ error: "Alias is already taken" }, { status: 400 });
      }
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const userId = uuidv4();
    const cleanAlias = alias ? alias.toLowerCase().replace(/[^a-z0-9]/g, '') : null;

    await sql`
      INSERT INTO users (id, email, password_hash, alias, created_at)
      VALUES (${userId}, ${email.toLowerCase()}, ${passwordHash}, ${cleanAlias}, NOW())
    `;

    // Create session
    const token = await createSession(userId);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase(),
        alias: cleanAlias,
      }
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}
