import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId, alias } = await request.json();

  if (!userId && !alias) {
    return NextResponse.json({ error: "Missing userId or alias" }, { status: 400 });
  }

  const mockEmails = [
    {
      profile_id: userId || null,
      recipient_alias: alias || null,
      sender: "support@github.com",
      subject: "Your OTP for GitHub login: 123456",
      body_text: "Please use the code 123456 to verify your identity.",
      body_html: "<p>Please use the code <strong>123456</strong> to verify your identity.</p>",
    },
    {
      profile_id: userId,
      recipient_alias: alias || null,
      sender: "newsletter@substack.com",
      subject: "The latest news in Tech",
      body_text: "Here is your weekly summary of tech news...",
      body_html: "<h1>Weekly Summary</h1><p>Here is your weekly summary of tech news...</p>",
    },
    {
      profile_id: userId,
      recipient_alias: alias || null,
      sender: "security@google.com",
      subject: "Security alert for your account",
      body_text: "A new device signed into your account. If this was you, ignore this email.",
      body_html: "<h2>Security Alert</h2><p>A new device signed into your account. If this was you, ignore this email.</p>",
    },
  ];

  const randomEmail = mockEmails[Math.floor(Math.random() * mockEmails.length)];

  try {
    const data = await sql`
      INSERT INTO emails (profile_id, recipient_alias, sender, subject, body_text, body_html)
      VALUES (${randomEmail.profile_id}, ${randomEmail.recipient_alias}, ${randomEmail.sender}, ${randomEmail.subject}, ${randomEmail.body_text}, ${randomEmail.body_html})
      RETURNING *
    `;

    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
