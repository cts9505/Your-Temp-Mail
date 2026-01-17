import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const data = await sql`
      SELECT id, email, alias, created_at 
      FROM users 
      WHERE id = ${userId} 
      LIMIT 1
    `;

    if (data.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get email stats
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_emails,
        COUNT(CASE WHEN received_at > NOW() - INTERVAL '24 hours' THEN 1 END) as emails_today,
        COUNT(CASE WHEN received_at > NOW() - INTERVAL '7 days' THEN 1 END) as emails_week
      FROM emails
      WHERE recipient_alias = ${data[0].alias}
    `;

    return NextResponse.json({
      ...data[0],
      stats: statsResult[0]
    });
  } catch (error: any) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update profile (alias, etc.)
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { alias, email } = await request.json();

    if (alias) {
      // Check if alias is already taken
      const existing = await sql`
        SELECT id FROM users 
        WHERE alias = ${alias} AND id != ${session.userId}
        LIMIT 1
      `;

      if (existing.length > 0) {
        return NextResponse.json({ error: "Alias already taken" }, { status: 400 });
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (alias !== undefined) {
      updates.push(`alias = $${updates.length + 1}`);
      values.push(alias);
    }

    if (email !== undefined) {
      updates.push(`email = $${updates.length + 1}`);
      values.push(email);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const result = await sql`
      UPDATE users 
      SET ${sql.raw(updates.join(", "))}
      WHERE id = ${session.userId}
      RETURNING id, email, alias, created_at
    `;

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
