# 🗄️ Database Migration Guide

## Quick Start

```bash
# Run full migration (create tables + insert test data)
npm run db:migrate

# Or seed data only (if tables already exist)
npm run db:seed
```

---

## 📋 What Gets Created

### Tables
✅ **users** - User accounts with authentication  
✅ **sessions** - Auth session tokens  
✅ **emails** - Received emails from SMTP  

### Indexes
✅ Performance indexes on frequently queried fields  
✅ Full-text search index for email content  

### Test Data
✅ **2 test users** with login credentials  
✅ **15 sample emails** across multiple aliases  
✅ **Guest emails** for non-authenticated testing  

---

## 🧪 Test Credentials

### User 1
```
Email: testuser@example.com
Password: password123
Alias: testuser
Emails: 10 test emails
```

### User 2
```
Email: demo@example.com
Password: password123
Alias: demouser
Emails: 3 test emails
```

### Guest
```
Alias: guest123
Emails: 2 test emails
Access: No login required
```

---

## 🔧 Available Commands

```bash
# Full migration (tables + data)
npm run db:migrate

# Seed data only
npm run db:seed

# Alternative: setup database
npm run db:setup
```

---

## 📊 Database Schema

### Users Table
```sql
id              UUID PRIMARY KEY
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
alias           VARCHAR(100) UNIQUE
created_at      TIMESTAMP
```

### Sessions Table
```sql
id              UUID PRIMARY KEY
user_id         UUID → users(id)
token           VARCHAR(255) UNIQUE
expires_at      TIMESTAMP
created_at      TIMESTAMP
```

### Emails Table
```sql
id              UUID PRIMARY KEY
profile_id      UUID
recipient_alias VARCHAR(100) → indexed
sender          VARCHAR(255) → indexed
subject         TEXT
body_text       TEXT → full-text search
body_html       TEXT
is_read         BOOLEAN
received_at     TIMESTAMP → indexed
```

---

## 🧪 Testing After Migration

### 1. Start the app
```bash
npm run dev
```

### 2. Test Login
```
Navigate to: http://localhost:3000/auth/login
Email: testuser@example.com
Password: password123
```

### 3. Check Inbox
```bash
# API test
curl "http://localhost:3000/api/inbox?alias=testuser"

# Or visit in browser
http://localhost:3000/inbox
```

### 4. Test Guest Access
```
Visit: http://localhost:3000/inbox?alias=guest123
```

---

## 🔄 Re-running Migration

If you need to start fresh:

### Option 1: Drop and recreate (destructive)
```sql
-- In Neon SQL Editor
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Then run:
```bash
npm run db:migrate
```

### Option 2: Delete data only
```sql
-- Keep tables, remove data
DELETE FROM emails;
DELETE FROM sessions;
DELETE FROM users;
```

Then run:
```bash
npm run db:seed
```

---

## 📧 Test Email Examples

The migration creates realistic test emails including:

- Welcome emails
- Security alerts
- Billing notifications
- Package shipping updates
- Newsletter subscriptions
- Social media notifications
- Payment confirmations
- Verification codes

---

## 🔍 Verifying Migration Success

### Check tables exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Check data inserted
```sql
-- Count users
SELECT COUNT(*) FROM users;
-- Should return: 2

-- Count emails
SELECT COUNT(*) FROM emails;
-- Should return: 15

-- View all test data
SELECT 
  u.email, 
  u.alias, 
  COUNT(e.id) as email_count
FROM users u
LEFT JOIN emails e ON e.recipient_alias = u.alias
GROUP BY u.email, u.alias;
```

---

## 🚨 Troubleshooting

### Error: "relation already exists"
✅ **Solution**: Tables already exist, run `npm run db:seed` instead

### Error: "database connection failed"
❌ **Check**: DATABASE_URL in .env file is correct

### Error: "password authentication failed"
❌ **Check**: Connection string has correct credentials

### No test data showing
✅ **Solution**: Check if data already exists, migration skips if users exist

---

## 📝 Environment Variables Required

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

The migration script automatically reads from `.env` file.

---

## 🎯 Next Steps After Migration

1. ✅ Start app: `npm run dev`
2. ✅ Login with test credentials
3. ✅ View test emails in inbox
4. ✅ Test API endpoints
5. ✅ Configure AWS SMTP receiver
6. ✅ Deploy to production

---

## 💡 Tips

- **Password for all test users**: `password123`
- **Password hash**: `$2a$12$...` (bcrypt, 12 rounds)
- **Guest access**: No authentication needed for `guest123` alias
- **Email count**: Each user has multiple emails for testing pagination
- **Timestamps**: Test emails have realistic timestamps (hours/days ago)

---

## 🔐 Security Note

The test password (`password123`) is hashed with bcrypt. In production:
- Never commit real passwords
- Use strong, unique passwords
- Enable rate limiting on auth endpoints
- Use HTTPS only

---

## 📚 Related Files

- `migrate.js` - Main migration script
- `seed.js` - Data seeding script
- `database-schema.sql` - Raw SQL schema (reference only)
- `.env` - Database connection string

---

## ✨ Success Indicators

After successful migration, you should see:

```
✅ Database connected
✅ Users table created
✅ Sessions table created
✅ Emails table created
✅ Indexes created
✅ Full-text search index created
✅ Created 2 test users
✅ Created 15 test emails
```

You're all set! 🎉
