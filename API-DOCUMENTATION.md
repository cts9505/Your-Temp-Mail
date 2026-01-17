# API Documentation

## Overview
Your SMTP mail receiver backend on AWS adds emails to the Neon database. These API routes fetch and manage that data.

## Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

---

## 📬 Inbox Routes

### GET `/api/inbox`
Fetch emails for a user or alias with pagination and search.

**Query Parameters:**
- `userId` (string, optional): User ID for authenticated users
- `alias` (string, optional): Email alias (for guests or users)
- `limit` (number, optional): Results per page (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)
- `search` (string, optional): Search in sender, subject, and body

**Response:**
```json
{
  "emails": [
    {
      "id": "uuid",
      "sender": "sender@example.com",
      "subject": "Email subject",
      "received_at": "2026-01-16T10:30:00Z",
      "recipient_alias": "user123",
      "preview": "First 200 chars of email..."
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

**Example:**
```bash
# Get user's emails with pagination
GET /api/inbox?userId=abc-123&limit=20&offset=0

# Search guest emails by alias
GET /api/inbox?alias=guest456&search=newsletter

# Search with pagination
GET /api/inbox?alias=user789&search=invoice&limit=10&offset=20
```

---

### DELETE `/api/inbox`
Bulk delete multiple emails.

**Body:**
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "alias": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "deleted": 3
}
```

**Example:**
```bash
curl -X DELETE https://your-domain.com/api/inbox \
  -H "Content-Type: application/json" \
  -d '{"ids": ["uuid1", "uuid2"], "alias": "user123"}'
```

---

### GET `/api/inbox/[id]`
Get a specific email by ID.

**Response:**
```json
{
  "id": "uuid",
  "sender": "sender@example.com",
  "subject": "Email subject",
  "body_text": "Plain text body",
  "body_html": "<html>HTML body</html>",
  "received_at": "2026-01-16T10:30:00Z",
  "recipient_alias": "user123",
  "is_read": false
}
```

**Example:**
```bash
GET /api/inbox/abc-123-def-456
```

---

### DELETE `/api/inbox/[id]`
Delete a specific email.

**Response:**
```json
{
  "success": true,
  "id": "uuid"
}
```

**Example:**
```bash
curl -X DELETE https://your-domain.com/api/inbox/abc-123
```

---

### PATCH `/api/inbox/[id]`
Mark email as read/unread.

**Body:**
```json
{
  "is_read": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "is_read": true
}
```

**Example:**
```bash
curl -X PATCH https://your-domain.com/api/inbox/abc-123 \
  -H "Content-Type: application/json" \
  -d '{"is_read": true}'
```

---

### GET `/api/inbox/stats`
Get comprehensive email statistics for an alias.

**Query Parameters:**
- `alias` (string, required): Email alias

**Response:**
```json
{
  "stats": {
    "total_emails": 150,
    "last_hour": 5,
    "last_24h": 25,
    "last_week": 80,
    "last_month": 150,
    "latest_email": "2026-01-16T10:30:00Z",
    "unique_senders": 45
  },
  "topSenders": [
    { "sender": "sender1@example.com", "count": 20 },
    { "sender": "sender2@example.com", "count": 15 }
  ],
  "hourlyActivity": [
    { "hour": 8, "count": 5 },
    { "hour": 9, "count": 12 }
  ]
}
```

**Example:**
```bash
GET /api/inbox/stats?alias=user123
```

---

### GET `/api/inbox/search`
Advanced email search with filters.

**Query Parameters:**
- `alias` (string, required): Email alias
- `q` (string, optional): Search query
- `sender` (string, optional): Filter by sender
- `from` (string, optional): Start date (ISO 8601)
- `to` (string, optional): End date (ISO 8601)
- `limit` (number, optional): Results per page (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "results": [...],
  "total": 25,
  "limit": 20,
  "offset": 0,
  "query": {
    "q": "invoice",
    "sender": "billing@",
    "dateFrom": "2026-01-01",
    "dateTo": "2026-01-16"
  }
}
```

**Example:**
```bash
# Search with date range
GET /api/inbox/search?alias=user123&q=invoice&from=2026-01-01&to=2026-01-16

# Search by sender
GET /api/inbox/search?alias=user123&sender=newsletter@
```

---

### GET `/api/inbox/senders`
Get all unique senders for an alias with statistics.

**Query Parameters:**
- `alias` (string, required): Email alias

**Response:**
```json
{
  "senders": [
    {
      "sender": "sender1@example.com",
      "email_count": 25,
      "last_email": "2026-01-16T10:30:00Z",
      "first_email": "2026-01-01T08:15:00Z"
    }
  ]
}
```

**Example:**
```bash
GET /api/inbox/senders?alias=user123
```

---

### DELETE `/api/inbox/clear`
Delete all emails for an alias.

**Body:**
```json
{
  "alias": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "deleted": 150
}
```

**Example:**
```bash
curl -X DELETE https://your-domain.com/api/inbox/clear \
  -H "Content-Type: application/json" \
  -d '{"alias": "user123"}'
```

---

## 👤 Profile Routes

### GET `/api/profile`
Get user profile with email statistics.

**Query Parameters:**
- `userId` (string, required): User ID

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "alias": "user123",
  "created_at": "2026-01-01T10:00:00Z",
  "stats": {
    "total_emails": 150,
    "emails_today": 5,
    "emails_week": 45
  }
}
```

**Example:**
```bash
GET /api/profile?userId=abc-123
```

---

### PATCH `/api/profile`
Update user profile (requires authentication).

**Headers:**
- Cookie with valid session token

**Body:**
```json
{
  "alias": "newAlias",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "newemail@example.com",
  "alias": "newAlias",
  "created_at": "2026-01-01T10:00:00Z"
}
```

**Example:**
```bash
curl -X PATCH https://your-domain.com/api/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: session=token" \
  -d '{"alias": "newAlias"}'
```

---

### GET `/api/profile/alias`
Update user alias (alternative endpoint).

See [/api/alias/check](#get-apialiastcheck) for checking alias availability.

---

## 🔐 Authentication Routes

### POST `/api/auth/register`
Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "alias": "user123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "alias": "user123"
  }
}
```

---

### POST `/api/auth/login`
Login user and create session.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "alias": "user123"
  }
}
```

**Sets Cookie:**
```
session=token; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

---

### POST `/api/auth/logout`
Logout user and destroy session.

**Response:**
```json
{
  "success": true
}
```

---

### GET `/api/auth/session`
Get current session user.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "alias": "user123"
  }
}
```

---

## 🔍 Utility Routes

### GET `/api/alias/check`
Check if an alias is available.

**Query Parameters:**
- `alias` (string, required): Alias to check

**Response:**
```json
{
  "available": true
}
```

**Example:**
```bash
GET /api/alias/check?alias=newuser
```

---

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing/invalid parameters) |
| 401 | Unauthorized (invalid/missing session) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔒 Security Notes

1. **Session Authentication**: Routes requiring authentication check for valid session cookie
2. **Alias Validation**: Emails are filtered by recipient alias to ensure users only see their emails
3. **SQL Injection Prevention**: All queries use parameterized statements via Neon's template literals
4. **Password Hashing**: Passwords are hashed with bcrypt (12 rounds)
5. **HttpOnly Cookies**: Session tokens stored in HttpOnly cookies prevent XSS attacks

---

## 🚀 Integration with AWS SMTP Receiver

Your AWS SMTP receiver should insert emails into the database like this:

```sql
INSERT INTO emails (recipient_alias, sender, subject, body_text, body_html, received_at)
VALUES ($1, $2, $3, $4, $5, NOW());
```

**Required Fields:**
- `recipient_alias`: The temporary email alias (e.g., "user123")
- `sender`: From address
- `subject`: Email subject
- `body_text`: Plain text body
- `body_html`: HTML body (optional)

---

## 📝 Example Frontend Usage

```typescript
// Fetch inbox
const response = await fetch(`/api/inbox?alias=${userAlias}&limit=20`);
const { emails, total } = await response.json();

// Search emails
const searchResponse = await fetch(
  `/api/inbox/search?alias=${userAlias}&q=invoice&limit=10`
);
const { results } = await searchResponse.json();

// Delete email
await fetch(`/api/inbox/${emailId}`, { method: 'DELETE' });

// Mark as read
await fetch(`/api/inbox/${emailId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ is_read: true })
});

// Get stats
const statsResponse = await fetch(`/api/inbox/stats?alias=${userAlias}`);
const stats = await statsResponse.json();
```

---

## 🛠️ Testing

Test the APIs using curl, Postman, or your frontend:

```bash
# Test inbox retrieval
curl "http://localhost:3000/api/inbox?alias=testuser"

# Test search
curl "http://localhost:3000/api/inbox/search?alias=testuser&q=test"

# Test stats
curl "http://localhost:3000/api/inbox/stats?alias=testuser"
```
