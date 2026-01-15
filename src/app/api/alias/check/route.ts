import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alias = searchParams.get("alias");

  if (!alias) {
    return NextResponse.json({ error: "Missing alias" }, { status: 400 });
  }

  try {
    const data = await sql`
      SELECT alias FROM profiles 
      WHERE alias = ${alias.toLowerCase()} 
      LIMIT 1
    `;

    return NextResponse.json({ 
      available: data.length === 0,
      alias: alias.toLowerCase()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
