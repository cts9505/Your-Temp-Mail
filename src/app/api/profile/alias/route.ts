import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, alias } = body;

    if (!userId || !alias) {
      return NextResponse.json({ error: "Missing userId or alias" }, { status: 400 });
    }

    const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');

    await sql`
      UPDATE profiles 
      SET alias = ${cleanAlias}
      WHERE id = ${userId}
    `;

    return NextResponse.json({ success: true, alias: cleanAlias });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
