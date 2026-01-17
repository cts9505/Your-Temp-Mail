import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { alias } = body;

    if (!alias) {
      return NextResponse.json({ error: "Missing alias" }, { status: 400 });
    }

    const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (cleanAlias.length < 3) {
      return NextResponse.json({ error: "Alias must be at least 3 characters" }, { status: 400 });
    }

    // Check if alias is already taken
    const existing = await sql`
      SELECT id FROM users 
      WHERE alias = ${cleanAlias} AND id != ${session.user.id}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: "Alias already taken" }, { status: 400 });
    }

    // Update user's alias
    const result = await sql`
      UPDATE users 
      SET alias = ${cleanAlias}
      WHERE id = ${session.user.id}
      RETURNING id, email, alias
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: result[0] });
  } catch (error: any) {
    console.error("Alias update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
