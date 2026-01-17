import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { getGuestAliasFromCookie } from "@/lib/auth-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const alias = searchParams.get("alias");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const search = searchParams.get("search") || "";

  try {
    let emails;

    // Fetch by alias (for both authenticated users and guests)
    if (alias) {
      if (search) {
        emails = await sql`
          SELECT id, sender, subject, received_at, recipient_alias,
                 LEFT(body_text, 200) as preview
          FROM emails 
          WHERE recipient_alias = ${alias}
            AND (
              sender ILIKE ${`%${search}%`} 
              OR subject ILIKE ${`%${search}%`}
              OR body_text ILIKE ${`%${search}%`}
            )
          ORDER BY received_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else {
        emails = await sql`
          SELECT id, sender, subject, received_at, recipient_alias, is_read,
                 LEFT(body_text, 200) as preview
          FROM emails 
          WHERE recipient_alias = ${alias}
          ORDER BY received_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }

      // Get total count and unread count
      const countResult = await sql`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN is_read = false THEN 1 END) as unread
        FROM emails 
        WHERE recipient_alias = ${alias}
      `;
      
      return NextResponse.json({
        emails,
        total: parseInt(countResult[0]?.total || "0"),
        unread: parseInt(countResult[0]?.unread || "0"),
        limit,
        offset
      });
    }

    // Fetch by userId (authenticated users)
    if (userId) {
      // First get the user's alias
      const userResult = await sql`
        SELECT alias FROM users WHERE id = ${userId} LIMIT 1
      `;
      
      if (userResult.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userAlias = userResult[0].alias;

      if (search) {
        emails = await sql`
          SELECT id, sender, subject, received_at, recipient_alias,
                 LEFT(body_text, 200) as preview
          FROM emails 
          WHERE recipient_alias = ${userAlias}
            AND (
              sender ILIKE ${`%${search}%`} 
              OR subject ILIKE ${`%${search}%`}
              OR body_text ILIKE ${`%${search}%`}
            )
          ORDER BY received_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else {
        emails = await sql`
          SELECT id, sender, subject, received_at, recipient_alias,
                 LEFT(body_text, 200) as preview
          FROM emails 
          WHERE recipient_alias = ${userAlias}
          ORDER BY received_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }

      // Get total count
      const countResult = await sql`
        SELECT COUNT(*) as total 
        FROM emails 
        WHERE recipient_alias = ${userAlias}
      `;

      return NextResponse.json({
        emails,
        total: parseInt(countResult[0]?.total || "0"),
        limit,
        offset
      });
    }

    return NextResponse.json({ error: "Missing userId or alias" }, { status: 400 });
  } catch (error: any) {
    console.error("Inbox API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Bulk delete emails
export async function DELETE(request: Request) {
  try {
    const { ids, alias } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Missing or invalid ids array" }, { status: 400 });
    }

    if (!alias) {
      return NextResponse.json({ error: "Missing alias" }, { status: 400 });
    }

    // Delete only emails belonging to the user's alias for security
    const result = await sql`
      DELETE FROM emails 
      WHERE id = ANY(${ids}) 
        AND recipient_alias = ${alias}
      RETURNING id
    `;

    return NextResponse.json({ 
      success: true, 
      deleted: result.length 
    });
  } catch (error: any) {
    console.error("Bulk Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
