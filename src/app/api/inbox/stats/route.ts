import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alias = searchParams.get("alias");

  if (!alias) {
    return NextResponse.json({ error: "Missing alias" }, { status: 400 });
  }

  try {
    // Get comprehensive email statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_emails,
        COUNT(CASE WHEN received_at > NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour,
        COUNT(CASE WHEN received_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
        COUNT(CASE WHEN received_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_week,
        COUNT(CASE WHEN received_at > NOW() - INTERVAL '30 days' THEN 1 END) as last_month,
        MAX(received_at) as latest_email,
        COUNT(DISTINCT sender) as unique_senders
      FROM emails
      WHERE recipient_alias = ${alias}
    `;

    // Get top senders
    const topSenders = await sql`
      SELECT sender, COUNT(*) as count
      FROM emails
      WHERE recipient_alias = ${alias}
      GROUP BY sender
      ORDER BY count DESC
      LIMIT 5
    `;

    // Get email activity by hour (last 24 hours)
    const hourlyActivity = await sql`
      SELECT 
        EXTRACT(HOUR FROM received_at) as hour,
        COUNT(*) as count
      FROM emails
      WHERE recipient_alias = ${alias}
        AND received_at > NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour
    `;

    return NextResponse.json({
      stats: stats[0],
      topSenders,
      hourlyActivity
    });
  } catch (error: any) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
