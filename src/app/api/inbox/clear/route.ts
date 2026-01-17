import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

// Delete all emails for an alias
export async function DELETE(request: Request) {
  try {
    const { alias } = await request.json();

    if (!alias) {
      return NextResponse.json({ error: "Missing alias" }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM emails
      WHERE recipient_alias = ${alias}
      RETURNING id
    `;

    return NextResponse.json({ 
      success: true, 
      deleted: result.length 
    });
  } catch (error: any) {
    console.error("Clear Inbox Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
