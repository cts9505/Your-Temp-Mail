# Environment Setup Guide

## 🔐 Security Configuration

### 1. Copy Environment File
```bash
cp .env.example .env.local
```

### 2. Configure Your Domain
Update `NEXT_PUBLIC_DOMAIN` in `.env.local`:
```env
NEXT_PUBLIC_DOMAIN=yourdomain.com
```

This domain will appear in:
- Email addresses: `alias@yourdomain.com`
- All UI displays
- Landing page
- Profile page
- Inbox page

### 3. Generate Security Salt
The `NEXT_PUBLIC_ALIAS_SALT` is used to hash guest aliases in cookies, preventing users from tampering with their temporary email addresses.

**⚠️ CRITICAL: Change this before deployment!**

Generate a secure random salt (minimum 32 characters):
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or visit: https://generate-random.org/api-key-generator
```

Example:
```env
NEXT_PUBLIC_ALIAS_SALT=xK9mP2vL8nQ5wR7jT1yU3hF6gA4sD0zC8bN5mK2vL9pQ
```

### 4. Database Configuration
Add your Neon PostgreSQL connection string:
```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname
```

## 🔒 Security Features

### Guest Alias Protection
- Guest aliases are stored with a SHA-256 hash in cookies
- Hash = SHA256(alias + SALT)
- Both `guest_alias` and `guest_hash` cookies must match
- Prevents manual cookie manipulation
- Ensures data integrity

### How It Works
1. User generates temporary alias: `abc123xyz`
2. System creates hash: `SHA256('abc123xyz' + YOUR_SALT)`
3. Stores both in cookies:
   - `guest_alias=abc123xyz`
   - `guest_hash=<computed_hash>`
4. On retrieval, validates: `guest_hash === SHA256(guest_alias + YOUR_SALT)`
5. If mismatch, alias is rejected

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Copy `.env.example` to `.env.local`
- [ ] Set your custom domain in `NEXT_PUBLIC_DOMAIN`
- [ ] Generate and set secure `NEXT_PUBLIC_ALIAS_SALT` (32+ chars)
- [ ] Configure `DATABASE_URL` with your database
- [ ] Verify `NODE_ENV=production` in production
- [ ] Test alias creation and validation
- [ ] Ensure `.env.local` is in `.gitignore`

## 📝 Notes

- **Domain**: Can be changed anytime, appears in all email addresses
- **Salt**: NEVER commit to git, NEVER share publicly
- **Database**: Use connection pooling in production
- **Cookies**: 7-day expiration, HttpOnly (for auth), SameSite=Lax

## 🔍 Troubleshooting

**Alias validation failing?**
- Ensure `NEXT_PUBLIC_ALIAS_SALT` matches between sessions
- Check browser console for hash mismatch errors

**Domain not updating?**
- Restart dev server after changing `.env.local`
- Clear browser cache
- Verify `NEXT_PUBLIC_` prefix (required for client-side access)
