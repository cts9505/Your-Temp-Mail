import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

// Get all senders for an alias
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alias = searchParams.get("alias");

  if (!alias) {
    return NextResponse.json({ error: "Missing alias" }, { status: 400 });
  }

  try {
    const senders = await sql`
      SELECT 
        sender,
        COUNT(*) as email_count,
        MAX(received_at) as last_email,
        MIN(received_at) as first_email
      FROM emails
      WHERE recipient_alias = ${alias}
      GROUP BY sender
      ORDER BY email_count DESC
    `;

    return NextResponse.json({ senders });
  } catch (error: any) {
    console.error("Senders API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
