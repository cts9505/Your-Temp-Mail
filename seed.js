#!/usr/bin/env node

/**
 * Database Seeding Script
 * Adds test data only (assumes schema already exists)
 * Usage: node seed.js
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log('🌱 Seeding database with test data...\n');

  try {
    // Check if test data already exists
    const existingUsers = await sql`SELECT COUNT(*) as count FROM users`;
    if (parseInt(existingUsers[0].count) > 0) {
      console.log('⚠️  Database already has users. Do you want to add more test data?');
      console.log('   To start fresh, delete existing data first.\n');
      return;
    }

    // Password hash for "password123"
    const passwordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyDzK8mPLsKW';

    // Create test users
    console.log('👤 Creating test users...');
    const users = await sql`
      INSERT INTO users (email, password_hash, alias, created_at)
      VALUES 
        ('testuser@example.com', ${passwordHash}, 'testuser', NOW() - INTERVAL '7 days'),
        ('demo@example.com', ${passwordHash}, 'demouser', NOW() - INTERVAL '3 days'),
        ('john@example.com', ${passwordHash}, 'johnsmith', NOW() - INTERVAL '1 day')
      RETURNING id, email, alias
    `;
    console.log(`✅ Created ${users.length} users\n`);

    // Create sample emails
    console.log('📧 Creating sample emails...');
    
    const emailTemplates = [
      {
        sender: 'welcome@tempmail.com',
        subject: 'Welcome to TempMail!',
        body_text: 'Welcome! Your temporary email service is ready to use.',
        body_html: '<html><body><h1>Welcome to TempMail!</h1><p>Your temporary email service is ready.</p></body></html>'
      },
      {
        sender: 'security@service.com',
        subject: 'Security Alert',
        body_text: 'We detected a login from a new device.',
        body_html: '<html><body><h2>Security Alert</h2><p>New device detected</p></body></html>'
      },
      {
        sender: 'billing@company.com',
        subject: 'Invoice #12345',
        body_text: 'Your invoice for $99.99 is ready.',
        body_html: '<html><body><h1>Invoice</h1><p>Amount: $99.99</p></body></html>'
      },
      {
        sender: 'newsletter@blog.com',
        subject: 'Weekly Newsletter',
        body_text: 'Here are this week\'s top stories.',
        body_html: '<html><body><h1>Newsletter</h1><p>Top stories this week</p></body></html>'
      },
      {
        sender: 'noreply@social.com',
        subject: 'You have new notifications',
        body_text: 'You have 5 new notifications.',
        body_html: '<html><body><p>5 new notifications</p></body></html>'
      }
    ];

    let emailCount = 0;
    for (const user of users) {
      for (let i = 0; i < emailTemplates.length; i++) {
        const template = emailTemplates[i];
        await sql`
          INSERT INTO emails (
            recipient_alias, sender, subject, body_text, body_html, 
            received_at, is_read
          ) VALUES (
            ${user.alias},
            ${template.sender},
            ${template.subject},
            ${template.body_text},
            ${template.body_html},
            NOW() - INTERVAL ${`${i + 1} hours`},
            ${i === 0}
          )
        `;
        emailCount++;
      }
    }
    console.log(`✅ Created ${emailCount} emails\n`);

    // Add guest emails
    console.log('📧 Creating guest emails...');
    await sql`
      INSERT INTO emails (recipient_alias, sender, subject, body_text, body_html, received_at)
      VALUES 
        ('guest123', 'verify@site.com', 'Verify your email', 'Click to verify', '<html><body>Click to verify</body></html>', NOW() - INTERVAL '10 minutes'),
        ('guest456', 'code@app.com', 'Your code is 999888', 'Code: 999888', '<html><body><h1>999888</h1></body></html>', NOW() - INTERVAL '5 minutes')
    `;
    console.log('✅ Created guest emails\n');

    console.log('═══════════════════════════════════════');
    console.log('  ✅ Seeding completed successfully!');
    console.log('═══════════════════════════════════════\n');

    console.log('📝 Test Credentials:');
    console.log('  Email: testuser@example.com');
    console.log('  Password: password123\n');
    
    console.log('  Email: demo@example.com');
    console.log('  Password: password123\n');

    console.log('  Email: john@example.com');
    console.log('  Password: password123\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
