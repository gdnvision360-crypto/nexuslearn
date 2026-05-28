# NexusLearn — Local Development Setup Guide

A step-by-step walkthrough to get NexusLearn running on your local machine for testing and assessment.

---

## Prerequisites

Before starting, install these on your computer:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 18 or higher | https://nodejs.org |
| **npm** | Comes with Node.js | — |
| **Git** | Latest | https://git-scm.com |
| **PostgreSQL** | 14 or higher | https://postgresql.org/download |

### Verify Installation
Open your terminal and run:
```bash
node --version    # Should show v18.x or higher
npm --version     # Should show 9.x or higher
psql --version    # Should show 14.x or higher
```

---

## Step 1: Unzip the Project

```bash
# Unzip the downloaded package
unzip nexuslearn-production.zip -d nexuslearn
cd nexuslearn
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages (~2-3 minutes).

---

## Step 3: Set Up PostgreSQL Database

### Option A: Local PostgreSQL
```bash
# Open PostgreSQL shell
psql -U postgres

# Create the database
CREATE DATABASE nexuslearn;
CREATE USER nexuslearn_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nexuslearn TO nexuslearn_user;
\q
```

### Option B: Free Cloud Database (No Local Install Needed)
Use one of these free services:
- **Neon** (https://neon.tech) — 512 MB free, instant setup
- **Supabase** (https://supabase.com) — 500 MB free
- **Railway** (https://railway.app) — 1 GB free

Sign up, create a PostgreSQL database, and copy the connection URL.

---

## Step 4: Configure Environment Variables

Copy the example env file:
```bash
cp .env.example .env
```

Edit `.env` and fill in these **required** values:

```env
# ============================================
# DATABASE (Required)
# ============================================
DATABASE_URL="postgresql://nexuslearn_user:your_secure_password@localhost:5432/nexuslearn"
# If using Neon/Supabase, paste their connection URL instead

# ============================================
# AUTH (Required)
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-string-here-at-least-32-chars"
# Generate one with: openssl rand -base64 32

# ============================================
# OAUTH PROVIDERS (Optional for testing)
# ============================================
# Google OAuth — https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# GitHub OAuth — https://github.com/settings/developers
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# ============================================
# EMAIL (Optional — for testing invites/resets)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@nexuslearn.com"

# ============================================
# FILE STORAGE (Optional)
# ============================================
# For local testing, files are stored in /public/uploads
# For production, configure S3:
# S3_BUCKET=""
# S3_REGION=""
# S3_ACCESS_KEY=""
# S3_SECRET_KEY=""

# ============================================
# VIDEO CONFERENCING (Optional)
# ============================================
# LiveKit — https://livekit.io (free tier available)
LIVEKIT_API_KEY=""
LIVEKIT_API_SECRET=""
LIVEKIT_URL=""

# ============================================
# STRIPE BILLING (Optional)
# ============================================
# https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# ============================================
# AI FEATURES (Optional)
# ============================================
OPENAI_API_KEY=""
```

### Quick Start (Minimum Config)
For a quick test, you only need:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

Everything else can be added later as you test each feature.

---

## Step 5: Initialize the Database

```bash
# Push the schema to create all 80 tables
npx prisma db push

# (Optional) Generate Prisma client
npx prisma generate

# (Optional) Seed with sample data
npx prisma db seed
```

### Verify Tables Created
```bash
npx prisma studio
```
This opens a visual database browser at `http://localhost:5555` where you can see all 80 tables.

---

## Step 6: Start the Development Server

```bash
npm run dev
```

Open your browser to: **http://localhost:3000**

You should see the NexusLearn landing page!

---

## Step 7: Create Your First Account

1. Go to `http://localhost:3000/auth/register`
2. Fill in your name, email, and password
3. Click Register
4. You're in! 🎉

### Make Yourself an Admin
```bash
# Open Prisma Studio
npx prisma studio
```
1. Find your user in the `User` table
2. Change `role` to `ADMIN`
3. Save — you now have full admin access

---

## Step 8: Test Each Feature

Now follow the **QA Testing Checklist** (see QA-TESTING-CHECKLIST.md) to systematically test every feature.

---

## Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules
npm install
```

### Database connection errors
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env` is correct
- For Neon/Supabase: ensure `?sslmode=require` is in the URL

### Port 3000 already in use
```bash
# Find what's using port 3000
lsof -i :3000
# Or use a different port
PORT=3001 npm run dev
```

### Prisma errors
```bash
npx prisma generate
npx prisma db push --force-reset  # WARNING: This resets all data
```

### OAuth not working
- Google: Add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI
- GitHub: Add `http://localhost:3000/api/auth/callback/github` as authorization callback URL

---

## What's Testable Without External Services

| Feature | Works Locally? | Notes |
|---------|---------------|-------|
| Registration & Login | ✅ Yes | Email/password works immediately |
| Dashboard | ✅ Yes | Full access |
| Course Creation | ✅ Yes | Create courses, modules, lessons |
| Quizzes & Assignments | ✅ Yes | Full quiz engine |
| Meeting Scheduling | ✅ Yes | Create & manage meetings |
| Meeting Video/Audio | ⚠️ Needs LiveKit | Free tier at livekit.io |
| File Upload | ✅ Yes | Local storage mode |
| YouTube Download | ⚠️ Needs yt-dlp | `pip install yt-dlp` |
| Social Login (Google/GitHub) | ⚠️ Needs OAuth keys | Free to set up |
| Email (Invites/Resets) | ⚠️ Needs SMTP | Use Gmail app password |
| Stripe Billing | ⚠️ Needs Stripe keys | Free test mode available |
| AI Features | ⚠️ Needs OpenAI key | Pay-per-use |
| Admin Dashboard | ✅ Yes | Set yourself as admin |
| Themes / Dark Mode | ✅ Yes | Toggle in settings |
| Social Media Module | ⚠️ Needs platform API keys | Free developer accounts |

---

## Next Steps

Once you've tested locally:
1. See **CLOUD-DEPLOY-GUIDE.md** for deploying to the internet
2. See **QA-TESTING-CHECKLIST.md** for systematic feature testing
3. See **DEPLOYMENT-GUIDE.md** for full production deployment
