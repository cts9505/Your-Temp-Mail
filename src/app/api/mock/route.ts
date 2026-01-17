import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/mock?alias=myalias - Generate 5 test emails for any alias
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alias = searchParams.get('alias');

    if (!alias) {
      return NextResponse.json(
        { error: 'Alias parameter is required. Usage: /api/mock?alias=youralias' },
        { status: 400 }
      );
    }

    // Check existing emails
    const existing = await sql`
      SELECT COUNT(*) as count FROM emails WHERE recipient_alias = ${alias}
    `;

    const existingCount = parseInt(existing[0].count);

    // Insert 5 mock emails
    await sql`
      INSERT INTO emails (recipient_alias, sender, subject, body_text, body_html, received_at, is_read)
      VALUES 
        (
          ${alias},
          'welcome@yourtempmail.com',
          'Welcome to Your Temp Mail!',
          'Your temporary email is ready. You can now receive emails at ' || ${alias} || '@yourtempmail.com',
          '<html><body><h1>Welcome!</h1><p>Your temporary email is ready.</p></body></html>',
          NOW() - INTERVAL '2 hours',
          false
        ),
        (
          ${alias},
          'notifications@github.com',
          '[GitHub] New follower',
          'Someone started following you on GitHub. Check out their profile!',
          '<html><body><p>New follower notification</p></body></html>',
          NOW() - INTERVAL '1 hour',
          false
        ),
        (
          ${alias},
          'newsletter@techcrunch.com',
          'TechCrunch Daily: Latest tech news',
          'Here are today''s top tech stories and updates from the world of technology.',
          '<html><body><h2>Newsletter</h2></body></html>',
          NOW() - INTERVAL '30 minutes',
          false
        ),
        (
          ${alias},
          'verify@service.com',
          'Verify your email address',
          'Click the link to verify: https://example.com/verify?code=ABC123XYZ',
          '<html><body><a href="#">Verify Email</a></body></html>',
          NOW() - INTERVAL '15 minutes',
          false
        ),
        (
          ${alias},
          'alerts@app.com',
          'Your verification code is 789456',
          'Your verification code is: 789456. This code is valid for 10 minutes.',
          '<html><body><h1>Verification Code: <strong>789456</strong></h1></body></html>',
          NOW() - INTERVAL '5 minutes',
          false
        )
    `;

    return NextResponse.json({
      success: true,
      message: `Created 5 new emails for ${alias}@yourtempmail.com`,
      alias,
      previousCount: existingCount,
      newCount: existingCount + 5
    });

  } catch (error: any) {
    console.error('Mock email error:', error);
    return NextResponse.json(
      { error: 'Failed to create emails', details: error.message },
      { status: 500 }
    );
  }
}

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
