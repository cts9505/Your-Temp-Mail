#!/usr/bin/env node

/**
 * Database Status Checker
 * Shows current state of database
 * Usage: node check-db.js
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkDatabase() {
  console.log('\n📊 Database Status Check\n');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Check connection
    console.log('🔌 Testing connection...');
    await sql`SELECT 1`;
    console.log('✅ Connected to database\n');

    // Check users
    console.log('👤 Users:');
    const users = await sql`
      SELECT id, email, alias, created_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    console.log(`   Total: ${users.length}`);
    users.forEach(u => {
      console.log(`   - ${u.email} (alias: ${u.alias})`);
    });
    console.log();

    // Check emails per user
    console.log('📧 Emails per alias:');
    const emailStats = await sql`
      SELECT 
        recipient_alias, 
        COUNT(*) as total,
        COUNT(CASE WHEN is_read THEN 1 END) as read_count,
        COUNT(CASE WHEN NOT is_read THEN 1 END) as unread_count,
        MAX(received_at) as latest
      FROM emails
      GROUP BY recipient_alias
      ORDER BY total DESC
    `;
    emailStats.forEach(stat => {
      console.log(`   ${stat.recipient_alias}:`);
      console.log(`     Total: ${stat.total} | Read: ${stat.read_count} | Unread: ${stat.unread_count}`);
      console.log(`     Latest: ${new Date(stat.latest).toLocaleString()}`);
    });
    console.log();

    // Total stats
    const totalEmails = await sql`SELECT COUNT(*) as count FROM emails`;
    const totalSessions = await sql`SELECT COUNT(*) as count FROM sessions`;
    
    console.log('📊 Overall Stats:');
    console.log(`   Total Users: ${users.length}`);
    console.log(`   Total Emails: ${totalEmails[0].count}`);
    console.log(`   Active Sessions: ${totalSessions[0].count}`);
    console.log();

    // Recent emails
    console.log('📬 Recent Emails (last 5):');
    const recentEmails = await sql`
      SELECT 
        recipient_alias,
        sender,
        subject,
        received_at
      FROM emails
      ORDER BY received_at DESC
      LIMIT 5
    `;
    recentEmails.forEach(email => {
      const time = new Date(email.received_at).toLocaleString();
      console.log(`   To: ${email.recipient_alias}`);
      console.log(`   From: ${email.sender}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Time: ${time}`);
      console.log();
    });

    console.log('═══════════════════════════════════════════');
    console.log('✅ Database check completed');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase().then(() => process.exit(0));
