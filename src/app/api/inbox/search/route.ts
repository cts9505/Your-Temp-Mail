import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

// Search emails with advanced filtering
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alias = searchParams.get("alias");
  const query = searchParams.get("q") || "";
  const sender = searchParams.get("sender");
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!alias) {
    return NextResponse.json({ error: "Missing alias" }, { status: 400 });
  }

  try {
    // Build query with all conditions
    let results;
    let countResult;

    if (query && sender && dateFrom && dateTo) {
      // All filters
      results = await sql`
        SELECT id, sender, subject, received_at, recipient_alias,
               LEFT(body_text, 200) as preview
        FROM emails
        WHERE recipient_alias = ${alias}
          AND (sender ILIKE ${'%' + query + '%'} OR subject ILIKE ${'%' + query + '%'} OR body_text ILIKE ${'%' + query + '%'})
          AND sender ILIKE ${'%' + sender + '%'}
          AND received_at >= ${dateFrom}
          AND received_at <= ${dateTo}
        ORDER BY received_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total FROM emails
        WHERE recipient_alias = ${alias}
          AND (sender ILIKE ${'%' + query + '%'} OR subject ILIKE ${'%' + query + '%'} OR body_text ILIKE ${'%' + query + '%'})
          AND sender ILIKE ${'%' + sender + '%'}
          AND received_at >= ${dateFrom}
          AND received_at <= ${dateTo}
      `;
    } else if (query && sender) {
      results = await sql`
        SELECT id, sender, subject, received_at, recipient_alias,
               LEFT(body_text, 200) as preview
        FROM emails
        WHERE recipient_alias = ${alias}
          AND (sender ILIKE ${'%' + query + '%'} OR subject ILIKE ${'%' + query + '%'} OR body_text ILIKE ${'%' + query + '%'})
          AND sender ILIKE ${'%' + sender + '%'}
        ORDER BY received_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM emails WHERE recipient_alias = ${alias} AND (sender ILIKE ${'%' + query + '%'} OR subject ILIKE ${'%' + query + '%'} OR body_text ILIKE ${'%' + query + '%'}) AND sender ILIKE ${'%' + sender + '%'}`;
    } else if (query) {
      results = await sql`
        SELECT id, sender, subject, received_at, recipient_alias,
               LEFT(body_text, 200) as preview
        FROM emails
        WHERE recipient_alias = ${alias}
          AND (sender ILIKE ${'%' + query + '%'} OR subject ILIKE ${'%' + query + '%'} OR body_text ILIKE ${'%' + query + '%'})
        ORDER BY received_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM emails WHERE recipient_alias = ${alias} AND (sender ILIKE ${'%' + query + '%'} OR subject ILIKE ${'%' + query + '%'} OR body_text ILIKE ${'%' + query + '%'})`;
    } else if (sender) {
      results = await sql`
        SELECT id, sender, subject, received_at, recipient_alias,
               LEFT(body_text, 200) as preview
        FROM emails
        WHERE recipient_alias = ${alias} AND sender ILIKE ${'%' + sender + '%'}
        ORDER BY received_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM emails WHERE recipient_alias = ${alias} AND sender ILIKE ${'%' + sender + '%'}`;
    } else {
      results = await sql`
        SELECT id, sender, subject, received_at, recipient_alias,
               LEFT(body_text, 200) as preview
        FROM emails
        WHERE recipient_alias = ${alias}
        ORDER BY received_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM emails WHERE recipient_alias = ${alias}`;
    }

    return NextResponse.json({
      results,
      total: parseInt(countResult[0]?.total || "0"),
      limit,
      offset,
      query: {
        q: query,
        sender,
        dateFrom,
        dateTo
      }
    });
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
