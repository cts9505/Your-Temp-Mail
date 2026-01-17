import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await sql`
      SELECT * FROM emails 
      WHERE id = ${id} 
      LIMIT 1
    `;

    if (data.length === 0) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error: any) {
    console.error("Get Email Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await sql`
      DELETE FROM emails 
      WHERE id = ${id}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error: any) {
    console.error("Delete Email Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Mark email as read/unread (optional feature)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { is_read } = await request.json();

    const result = await sql`
      UPDATE emails 
      SET is_read = ${is_read}
      WHERE id = ${id}
      RETURNING id, is_read
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error("Update Email Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
