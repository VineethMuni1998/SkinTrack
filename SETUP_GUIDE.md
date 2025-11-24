# SkinTrack API Keys & Credentials Setup Guide

This guide will walk you through getting all the API keys and credentials needed to run SkinTrack.

## Required Services

1. **PostgreSQL Database** (DATABASE_URL)
2. **NextAuth Secret** (NEXTAUTH_SECRET)
3. **OpenAI API** (OPENAI_API_KEY)
4. **Cloudinary** (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)

---

## 1. PostgreSQL Database (DATABASE_URL)

### Option A: Free Cloud Database (Recommended for Quick Start)

**Supabase (Free Tier Available)**
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up/login
3. Click "New Project"
4. Fill in:
   - Project name: `skintrack`
   - Database password: (create a strong password - save it!)
   - Region: Choose closest to you
5. Wait for project to be created (~2 minutes)
6. Go to **Settings** → **Database**
7. Find **Connection string** → **URI**
8. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
9. Replace `[YOUR-PASSWORD]` with the password you created
10. Add `?schema=public` at the end if not present

**Neon (Free Tier Available)**
1. Go to [https://neon.tech](https://neon.tech)
2. Sign up/login
3. Click "Create Project"
4. Fill in project details
5. Copy the connection string from the dashboard
6. Format: `postgresql://user:password@host/database?sslmode=require`

### Option B: Local PostgreSQL

**macOS (using Homebrew)**
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create database
createdb skintrack

# Your DATABASE_URL will be:
# postgresql://[your-username]@localhost:5432/skintrack?schema=public
```

**Windows**
1. Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
2. Install and remember the password you set
3. Create database using pgAdmin or command line
4. Connection string: `postgresql://postgres:password@localhost:5432/skintrack?schema=public`

---

## 2. NextAuth Secret (NEXTAUTH_SECRET)

Generate a secure random secret:

**macOS/Linux:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Or use online generator:**
- Visit [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)
- Copy the generated secret

**Add to .env:**
```
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## 3. OpenAI API Key (OPENAI_API_KEY)

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Click your profile icon (top right) → **View API keys**
4. Click **Create new secret key**
5. Give it a name (e.g., "SkinTrack")
6. **IMPORTANT:** Copy the key immediately - you won't see it again!
7. If you lose it, delete and create a new one

**Pricing Note:**
- GPT-4 costs ~$0.03 per analysis (very affordable)
- You get $5 free credit when you sign up
- Set usage limits in Settings → Billing → Usage limits

**Add to .env:**
```
OPENAI_API_KEY=sk-...
```

---

## 4. Cloudinary (Image Storage)

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click **Sign Up for Free**
3. Fill in your details and verify email
4. After login, you'll see your **Dashboard**
5. On the dashboard, you'll see:
   - **Cloud name** (e.g., `dxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (click "Reveal" to see it)

**Add to .env:**
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Free Tier:**
- 25 GB storage
- 25 GB monthly bandwidth
- Perfect for development and small projects

---

## Complete .env File Template

Once you have all credentials, your `.env` file should look like:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# OpenAI
OPENAI_API_KEY="sk-your-openai-key-here"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

---

## Verification Steps

After setting up all credentials:

1. **Check your .env file:**
   ```bash
   # Make sure all variables are set (no empty values)
   cat .env
   ```

2. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

3. **Push database schema:**
   ```bash
   npm run db:push
   ```

4. **Start the app:**
   ```bash
   npm run dev
   ```

5. **Test the app:**
   - Open http://localhost:3000
   - Sign up for an account
   - Try uploading a photo
   - Add products and run AI analysis

---

## Troubleshooting

**Database Connection Error:**
- Verify DATABASE_URL format is correct
- Check if database server is running
- Ensure password doesn't contain special characters that need URL encoding

**OpenAI API Error:**
- Verify API key is correct (starts with `sk-`)
- Check if you have credits/billing set up
- Ensure API key hasn't been revoked

**Cloudinary Upload Error:**
- Verify all three Cloudinary credentials are correct
- Check if you've exceeded free tier limits
- Ensure cloud name doesn't have extra spaces

**NextAuth Error:**
- Make sure NEXTAUTH_SECRET is at least 32 characters
- Verify NEXTAUTH_URL matches your app URL

---

## Cost Summary (Free Tier)

- **Supabase/Neon:** Free (up to 500MB database)
- **OpenAI:** $5 free credit (enough for ~150 analyses)
- **Cloudinary:** Free (25GB storage, 25GB bandwidth)
- **Total:** $0/month for development/testing

---

## Need Help?

If you get stuck on any step, let me know which service you're having trouble with!

