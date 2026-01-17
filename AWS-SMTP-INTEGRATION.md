# AWS SMTP Receiver Integration Guide

## Overview
Your AWS SMTP receiver backend receives emails and stores them in the Neon PostgreSQL database. This guide shows how to integrate it with your Next.js app.

---

## 📥 Email Storage Format

When your AWS SMTP receiver processes an incoming email, it should insert it into the database with this format:

### SQL Insert Statement
```sql
INSERT INTO emails (
  recipient_alias,
  sender,
  subject,
  body_text,
  body_html,
  received_at,
  is_read
) VALUES (
  $1,  -- recipient_alias: e.g., 'user123'
  $2,  -- sender: e.g., 'sender@example.com'
  $3,  -- subject: e.g., 'Welcome to our service'
  $4,  -- body_text: plain text version
  $5,  -- body_html: HTML version (optional)
  NOW(),
  FALSE
);
```

### Example Values
```javascript
{
  recipient_alias: "user123",  // Extract from To: field (user123@yourdomain.com)
  sender: "notifications@example.com",
  subject: "Your order has been shipped",
  body_text: "Hi there, your order #12345 has been shipped...",
  body_html: "<html><body><p>Hi there, your order #12345...</p></body></html>",
  received_at: "2026-01-16T10:30:00Z",
  is_read: false
}
```

---

## 🔧 AWS Lambda Function Example

Here's how your AWS Lambda function might look:

```javascript
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  const sql = neon(process.env.DATABASE_URL);
  
  // Parse the SES event
  const sesNotification = JSON.parse(event.Records[0].Sns.Message);
  const mail = sesNotification.mail;
  const content = sesNotification.content;
  
  // Extract recipient alias from email address
  // If email is "user123@yourdomain.com", extract "user123"
  const recipientEmail = mail.destination[0]; // e.g., "user123@yourdomain.com"
  const recipientAlias = recipientEmail.split('@')[0]; // "user123"
  
  // Parse email content (you might need a library like mailparser)
  const parsed = await parseEmail(content);
  
  try {
    // Insert into database
    await sql`
      INSERT INTO emails (
        recipient_alias,
        sender,
        subject,
        body_text,
        body_html,
        received_at,
        is_read
      ) VALUES (
        ${recipientAlias},
        ${mail.source},
        ${parsed.subject},
        ${parsed.text},
        ${parsed.html},
        ${new Date(mail.timestamp).toISOString()},
        false
      )
    `;
    
    console.log(`Email stored for ${recipientAlias}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email processed successfully' })
    };
  } catch (error) {
    console.error('Error storing email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to store email' })
    };
  }
};

async function parseEmail(rawEmail) {
  // Use a library like 'mailparser' to parse the email
  const simpleParser = require('mailparser').simpleParser;
  const parsed = await simpleParser(rawEmail);
  
  return {
    subject: parsed.subject,
    text: parsed.text,
    html: parsed.html
  };
}
```

---

## 🌐 Domain Setup

### 1. Configure Your Domain
Your temporary email addresses will look like: `{alias}@yourdomain.com`

Example: `user123@tempmail.yourdomain.com`

### 2. AWS SES Setup
1. Verify your domain in AWS SES
2. Set up MX records pointing to SES
3. Create SES receipt rules to trigger your Lambda function

### 3. MX Records
```
Priority  Mail Server
10        inbound-smtp.us-east-1.amazonaws.com
```

---

## 🔄 Email Flow

```
1. External sender sends email to: user123@yourdomain.com
   ↓
2. DNS MX records route to AWS SES
   ↓
3. SES triggers Lambda function via SNS
   ↓
4. Lambda parses email and stores in Neon DB
   ↓
5. Next.js app fetches from /api/inbox
   ↓
6. User sees email in their inbox
```

---

## 📊 Database Connection

Your AWS Lambda needs the Neon connection string:

```javascript
// In AWS Lambda Environment Variables
DATABASE_URL=postgresql://neondb_owner:password@ep-xxxx.aws.neon.tech/neondb?sslmode=require
```

**Install Dependencies:**
```bash
npm install @neondatabase/serverless
npm install mailparser
```

---

## 🧪 Testing

### Test Email Insert Directly
```sql
-- Insert a test email
INSERT INTO emails (recipient_alias, sender, subject, body_text, body_html, received_at, is_read)
VALUES (
  'testuser',
  'test@example.com',
  'Test Email',
  'This is a test email body.',
  '<html><body><p>This is a test email body.</p></body></html>',
  NOW(),
  FALSE
);
```

### Verify in Next.js App
```bash
# Start your app
npm run dev

# Visit
http://localhost:3000/inbox?alias=testuser
```

### Test API Endpoint
```bash
curl "http://localhost:3000/api/inbox?alias=testuser"
```

---

## 🔐 Security Considerations

1. **Validate Recipient Alias**: Ensure alias exists before storing email
2. **Rate Limiting**: Implement rate limiting in Lambda to prevent abuse
3. **Spam Filtering**: Use AWS SES spam filtering features
4. **Size Limits**: Set maximum email size (e.g., 10MB)
5. **Sanitization**: Sanitize HTML content before storing

### Example Validation in Lambda
```javascript
// Check if alias exists
const userCheck = await sql`
  SELECT id FROM users WHERE alias = ${recipientAlias}
  LIMIT 1
`;

if (userCheck.length === 0) {
  console.log(`Rejected email for non-existent alias: ${recipientAlias}`);
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Recipient not found' })
  };
}
```

---

## 📦 Complete Lambda Package Structure

```
aws-smtp-lambda/
├── package.json
├── index.js           # Main Lambda handler
├── emailParser.js     # Email parsing utilities
├── dbClient.js        # Neon DB connection
└── node_modules/
    ├── @neondatabase/serverless
    └── mailparser
```

### package.json
```json
{
  "name": "smtp-receiver-lambda",
  "version": "1.0.0",
  "dependencies": {
    "@neondatabase/serverless": "^0.10.6",
    "mailparser": "^3.7.1"
  }
}
```

---

## 🚀 Deployment Checklist

- [ ] Neon database is set up with correct schema
- [ ] AWS SES domain is verified
- [ ] MX records are configured
- [ ] Lambda function is deployed
- [ ] Lambda has DATABASE_URL environment variable
- [ ] SES receipt rule triggers Lambda via SNS
- [ ] Test email sent and received
- [ ] Next.js app can fetch emails from API
- [ ] Environment variables set in Vercel

---

## 📞 API Endpoints Used by SMTP Receiver

Your SMTP receiver only needs to **INSERT** into the database. The Next.js app handles all reads:

| Operation | Method | Endpoint | Purpose |
|-----------|--------|----------|---------|
| Fetch emails | GET | `/api/inbox?alias=user123` | Display inbox |
| Get email | GET | `/api/inbox/{id}` | View email |
| Delete email | DELETE | `/api/inbox/{id}` | Delete email |
| Search | GET | `/api/inbox/search?alias=user123&q=test` | Search emails |
| Stats | GET | `/api/inbox/stats?alias=user123` | Dashboard stats |

---

## 💡 Tips

1. **Alias Format**: Keep aliases alphanumeric (a-z, 0-9, hyphen, underscore)
2. **Email Retention**: Consider auto-deleting emails older than 7-30 days
3. **Monitoring**: Set up CloudWatch alerts for Lambda failures
4. **Logging**: Log all email processing for debugging
5. **Backup**: Enable automatic backups in Neon

---

## 🐛 Troubleshooting

### Emails not appearing in inbox?

1. Check Lambda logs in CloudWatch:
```bash
aws logs tail /aws/lambda/smtp-receiver --follow
```

2. Verify database insert:
```sql
SELECT * FROM emails ORDER BY received_at DESC LIMIT 10;
```

3. Test API endpoint:
```bash
curl "http://localhost:3000/api/inbox?alias=testuser" | jq
```

### Database connection issues?

1. Check Neon connection string format
2. Ensure Lambda has internet access (in VPC with NAT gateway)
3. Verify DATABASE_URL environment variable

---

## 📚 Additional Resources

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Neon Database Docs](https://neon.tech/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [mailparser NPM](https://www.npmjs.com/package/mailparser)
