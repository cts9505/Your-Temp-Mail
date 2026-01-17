#!/usr/bin/env node

/**
 * Database Migration Script
 * Runs schema creation and inserts test data
 * Usage: node migrate.js
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Step 1: Create Users Table
    console.log('📦 Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        alias VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Users table created\n');

    // Step 2: Create Sessions Table
    console.log('📦 Creating sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Sessions table created\n');

    // Step 3: Create Emails Table
    console.log('📦 Creating emails table...');
    await sql`
      CREATE TABLE IF NOT EXISTS emails (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID,
        recipient_alias VARCHAR(100) NOT NULL,
        sender VARCHAR(255),
        subject TEXT,
        body_text TEXT,
        body_html TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        received_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Emails table created\n');

    // Step 4: Create Indexes
    console.log('📦 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_recipient_alias ON emails(recipient_alias)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_sender ON emails(sender)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`;
    console.log('✅ Indexes created\n');

    // Step 5: Create Full-Text Search Index
    console.log('📦 Creating full-text search index...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_emails_search ON emails 
      USING gin(to_tsvector('english', 
        coalesce(subject, '') || ' ' || 
        coalesce(body_text, '') || ' ' || 
        coalesce(sender, '')
      ))
    `;
    console.log('✅ Full-text search index created\n');

    console.log('✨ Schema migration completed successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

async function insertTestData() {
  console.log('🧪 Inserting test data...\n');

  try {
    // Check if test data already exists
    const existingUsers = await sql`SELECT COUNT(*) as count FROM users`;
    if (parseInt(existingUsers[0].count) > 0) {
      console.log('⚠️  Test data already exists. Skipping insertion.\n');
      return;
    }

    // Test User 1 - Regular user
    console.log('👤 Creating test user 1...');
    const user1 = await sql`
      INSERT INTO users (email, password_hash, alias, created_at)
      VALUES (
        'testuser@example.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyDzK8mPLsKW',
        'testuser',
        NOW() - INTERVAL '7 days'
      )
      RETURNING id, email, alias
    `;
    console.log(`✅ Created user: ${user1[0].email} (alias: ${user1[0].alias})\n`);

    // Test User 2 - Another user
    console.log('👤 Creating test user 2...');
    const user2 = await sql`
      INSERT INTO users (email, password_hash, alias, created_at)
      VALUES (
        'demo@example.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyDzK8mPLsKW',
        'demouser',
        NOW() - INTERVAL '3 days'
      )
      RETURNING id, email, alias
    `;
    console.log(`✅ Created user: ${user2[0].email} (alias: ${user2[0].alias})\n`);

    // Guest Alias (no user account)
    const guestAlias = 'guest123';

    // Insert test emails for user1
    console.log('📧 Creating test emails for testuser...');
    
    await sql`
      INSERT INTO emails (recipient_alias, sender, subject, body_text, body_html, received_at, is_read)
      VALUES 
        (
          ${user1[0].alias},
          'welcome@tempmail.com',
          'Welcome to TempMail!',
          'Welcome to TempMail! Your temporary email service is ready to use. You can now receive emails at ' || ${user1[0].alias} || '@yourdomain.com',
          '<html><body><h1>Welcome to TempMail!</h1><p>Your temporary email service is ready to use.</p></body></html>',
          NOW() - INTERVAL '6 days',
          true
        ),
        (
          ${user1[0].alias},
          'notifications@github.com',
          '[GitHub] You have a new follower',
          'John Doe is now following you on GitHub. Check out their profile and repositories.',
          '<html><body><p>John Doe is now following you on GitHub.</p></body></html>',
          NOW() - INTERVAL '5 days',
          true
        ),
        (
          ${user1[0].alias},
          'billing@netflix.com',
          'Your Netflix subscription has been renewed',
          'Your Netflix Premium subscription has been successfully renewed for $15.99. Your next billing date is next month.',
          '<html><body><h2>Subscription Renewed</h2><p>Amount: $15.99</p></body></html>',
          NOW() - INTERVAL '4 days',
          false
        ),
        (
          ${user1[0].alias},
          'noreply@amazon.com',
          'Your package has shipped!',
          'Great news! Your order #123-4567890-1234567 has shipped and will arrive in 2 days.',
          '<html><body><h1>Package Shipped</h1><p>Track your package: <a href="#">Track Now</a></p></body></html>',
          NOW() - INTERVAL '3 days',
          false
        ),
        (
          ${user1[0].alias},
          'security@paypal.com',
          'Unusual account activity detected',
          'We detected a login attempt from an unrecognized device. If this was not you, please secure your account immediately.',
          '<html><body><h2>Security Alert</h2><p>Login location: San Francisco, CA</p></body></html>',
          NOW() - INTERVAL '2 days',
          false
        ),
        (
          ${user1[0].alias},
          'newsletter@techcrunch.com',
          'TechCrunch Daily: Latest tech news',
          'Here are today''s top tech stories: AI startup raises $50M, New iPhone features leaked, and more.',
          '<html><body><h1>Daily Newsletter</h1><ul><li>Story 1</li><li>Story 2</li></ul></body></html>',
          NOW() - INTERVAL '1 day',
          false
        ),
        (
          ${user1[0].alias},
          'support@slack.com',
          'Your Slack workspace invitation',
          'You have been invited to join the "Awesome Team" workspace on Slack. Click here to accept.',
          '<html><body><p>Join workspace: <a href="#">Accept Invitation</a></p></body></html>',
          NOW() - INTERVAL '12 hours',
          false
        ),
        (
          ${user1[0].alias},
          'no-reply@linkedin.com',
          'You have 3 new connection requests',
          'Jane Smith, Bob Johnson, and Sarah Williams want to connect with you on LinkedIn.',
          '<html><body><h2>New Connections</h2><p>View your requests</p></body></html>',
          NOW() - INTERVAL '6 hours',
          false
        ),
        (
          ${user1[0].alias},
          'info@stripe.com',
          'Your payment has been processed',
          'A payment of $49.99 has been successfully processed for your subscription.',
          '<html><body><h1>Payment Confirmation</h1><p>Amount: $49.99</p></body></html>',
          NOW() - INTERVAL '3 hours',
          false
        ),
        (
          ${user1[0].alias},
          'alerts@twitter.com',
          'Someone mentioned you in a tweet',
          '@johndoe mentioned you: "Check out this awesome project by @' || ${user1[0].alias} || '!"',
          '<html><body><p>View tweet: <a href="#">Click here</a></p></body></html>',
          NOW() - INTERVAL '1 hour',
          false
        )
    `;
    console.log(`✅ Created 10 test emails for ${user1[0].alias}\n`);

    // Insert test emails for user2
    console.log('📧 Creating test emails for demouser...');
    await sql`
      INSERT INTO emails (recipient_alias, sender, subject, body_text, body_html, received_at, is_read)
      VALUES 
        (
          ${user2[0].alias},
          'welcome@tempmail.com',
          'Welcome to TempMail!',
          'Welcome to TempMail! Your temporary email service is ready.',
          '<html><body><h1>Welcome!</h1></body></html>',
          NOW() - INTERVAL '2 days',
          true
        ),
        (
          ${user2[0].alias},
          'promo@store.com',
          'Flash Sale: 50% off everything!',
          'Limited time offer! Get 50% off all items. Use code: FLASH50',
          '<html><body><h1>FLASH SALE</h1><p>50% OFF!</p></body></html>',
          NOW() - INTERVAL '1 day',
          false
        ),
        (
          ${user2[0].alias},
          'updates@vercel.com',
          'Your deployment is ready',
          'Your Next.js app has been successfully deployed to production.',
          '<html><body><h2>Deployment Success</h2></body></html>',
          NOW() - INTERVAL '6 hours',
          false
        )
    `;
    console.log(`✅ Created 3 test emails for ${user2[0].alias}\n`);

    // Insert test emails for guest
    console.log('📧 Creating test emails for guest...');
    await sql`
      INSERT INTO emails (recipient_alias, sender, subject, body_text, body_html, received_at, is_read)
      VALUES 
        (
          ${guestAlias},
          'verify@service.com',
          'Verify your email address',
          'Please verify your email address by clicking the link below.',
          '<html><body><p>Click to verify: <a href="#">Verify Email</a></p></body></html>',
          NOW() - INTERVAL '30 minutes',
          false
        ),
        (
          ${guestAlias},
          'noreply@website.com',
          'Your verification code is 123456',
          'Your verification code is: 123456. This code will expire in 10 minutes.',
          '<html><body><h1>Verification Code</h1><p><strong>123456</strong></p></body></html>',
          NOW() - INTERVAL '15 minutes',
          false
        )
    `;
    console.log(`✅ Created 2 test emails for ${guestAlias}\n`);

    // Summary
    console.log('📊 Test Data Summary:');
    console.log('  👤 Users created: 2');
    console.log('  📧 Total emails: 15');
    console.log('\n📝 Test Credentials:');
    console.log('  Email: testuser@example.com');
    console.log('  Password: password123');
    console.log('  Alias: testuser');
    console.log('\n  Email: demo@example.com');
    console.log('  Password: password123');
    console.log('  Alias: demouser');
    console.log('\n  Guest Alias: guest123');
    console.log('\n✨ Test data inserted successfully!\n');

  } catch (error) {
    console.error('❌ Test data insertion failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('  📦 Database Migration & Seeding Script');
    console.log('═══════════════════════════════════════════\n');

    // Check database connection
    console.log('🔌 Checking database connection...');
    await sql`SELECT 1`;
    console.log('✅ Database connected\n');

    // Run migration
    await runMigration();

    // Insert test data
    await insertTestData();

    console.log('═══════════════════════════════════════════');
    console.log('  ✅ All operations completed successfully!');
    console.log('═══════════════════════════════════════════\n');

    console.log('🚀 Next steps:');
    console.log('  1. Start your app: npm run dev');
    console.log('  2. Login with test credentials');
    console.log('  3. View test emails in inbox\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
