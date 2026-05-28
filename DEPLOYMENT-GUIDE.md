# NexusLearn — Deployment Guide

## 🏗️ Architecture Overview

NexusLearn is a **unified WebConference + LMS platform** built with:
- **Frontend/Backend**: Next.js 14 (App Router, TypeScript)
- **Database**: PostgreSQL via Prisma ORM (~60 models)
- **Auth**: NextAuth.js (Google, GitHub, Apple OAuth + Email/Password + 2FA)
- **Video/Audio**: LiveKit (WebRTC)
- **File Storage**: AWS S3 / Supabase Storage
- **Real-time**: Socket.IO + Server-Sent Events
- **AI Features**: OpenAI API (transcription, translation, AI Studio)
- **Phone/SIP**: Jitsi-compatible SIP gateway + SRTP

---

## 📋 Prerequisites

1. **Node.js** 18+ and npm/yarn/pnpm
2. **PostgreSQL** database (Supabase, Neon, Railway, or self-hosted)
3. **LiveKit** server (livekit.io cloud or self-hosted)
4. **AWS S3** bucket (or Supabase Storage / MinIO)
5. **OAuth credentials** for Google, GitHub, Apple (optional)
6. **OpenAI API key** (for AI features)
7. **SMTP server** (for email verification, notifications)

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone/extract the project
unzip nexuslearn-production.zip
cd nexuslearn-production

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Configure .env.local (see Environment Variables below)

# 5. Generate Prisma client
npx prisma generate

# 6. Run database migrations
npx prisma db push

# 7. Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## 🔐 Environment Variables (.env.local)

```env
# === DATABASE ===
DATABASE_URL="postgresql://user:password@host:5432/nexuslearn?sslmode=require"

# === NEXTAUTH ===
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# === OAUTH PROVIDERS ===
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""

# === LIVEKIT (Video Conferencing) ===
LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY=""
LIVEKIT_API_SECRET=""

# === AWS S3 (File Storage) ===
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET="nexuslearn-files"

# === OPENAI (AI Features) ===
OPENAI_API_KEY=""

# === SMTP (Email) ===
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@nexuslearn.com"

# === SIP/PHONE (Optional) ===
SIP_SERVER=""
SIP_USERNAME=""
SIP_PASSWORD=""
PSTN_PROVIDER_API_KEY=""

# === STREAMING (Optional) ===
YOUTUBE_STREAM_KEY=""
TWITCH_STREAM_KEY=""
CUSTOM_RTMP_URL=""
```

---

## ☁️ Deploy to Vercel + Supabase

### Step 1: Set Up Supabase (Database)
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy the connection string
3. Replace `[YOUR-PASSWORD]` in the connection string
4. Use this as `DATABASE_URL`

### Step 2: Set Up LiveKit (Video)
1. Create an account at [livekit.io](https://livekit.io)
2. Create a new project
3. Copy the URL, API Key, and API Secret

### Step 3: Set Up S3 (File Storage)
**Option A: AWS S3**
1. Create an S3 bucket with CORS enabled
2. Create an IAM user with S3 access
3. Copy access key and secret

**Option B: Supabase Storage**
1. In your Supabase project, go to Storage
2. Create a bucket called `nexuslearn-files`
3. Use Supabase's S3-compatible endpoint

### Step 4: Set Up OAuth
**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect: `https://your-domain.com/api/auth/callback/google`

**GitHub:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create OAuth App
3. Add callback: `https://your-domain.com/api/auth/callback/github`

**Apple:**
1. Go to [Apple Developer](https://developer.apple.com)
2. Create a Services ID + Key
3. Add redirect: `https://your-domain.com/api/auth/callback/apple`

### Step 5: Deploy to Vercel
1. Push code to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add all environment variables from above
4. Set `NEXTAUTH_URL` to your Vercel domain
5. Deploy!

### Step 6: Run Database Migration
```bash
# After first deploy, run:
npx prisma db push
# Or generate and run migrations:
npx prisma migrate deploy
```

---

## 🐳 Deploy with Docker

```bash
# Build the image
docker build -t nexuslearn .

# Run with environment file
docker run -p 3000:3000 --env-file .env.local nexuslearn
```

### Docker Compose (with PostgreSQL):
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env.local
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: nexuslearn
      POSTGRES_USER: nexuslearn
      POSTGRES_PASSWORD: your-password
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
volumes:
  pgdata:
```

---

## 📱 PWA Setup

NexusLearn is a Progressive Web App. After deployment:
1. Visit your deployed URL on mobile
2. Users will see an "Install NexusLearn" prompt
3. The app works offline for cached content
4. Push notifications are supported

To customize the PWA:
- Edit `public/manifest.json` for app name, colors, icons
- Edit `public/sw.js` for caching strategies
- Add your own app icons in `public/icons/`

---

## 📞 Phone/SIP Integration (Jitsi-Compatible)

For phone dial-in to meetings:

### Option A: Jitsi Meet SIP Gateway
1. Deploy [Jigasi](https://github.com/jitsi/jigasi) SIP gateway
2. Configure SIP trunk with your VoIP provider (Twilio, Vonage, etc.)
3. Set `SIP_SERVER`, `SIP_USERNAME`, `SIP_PASSWORD` in env
4. Each meeting gets a unique dial-in number + PIN

### Option B: LiveKit SIP Bridge
1. Use [LiveKit SIP](https://docs.livekit.io/sip/) for direct SIP integration
2. Configure a SIP trunk provider
3. Map phone calls to LiveKit rooms

### Option C: Twilio Programmable Voice
1. Create a Twilio account
2. Buy a phone number
3. Configure TwiML to bridge calls to LiveKit rooms

---

## 📊 Complete Feature List

### 🎥 WebConference (Zoom+ Level)
- HD Video/Audio with WebRTC (LiveKit)
- Screen sharing with annotation
- Breakout rooms with auto/manual assignment
- Live polls & Q&A with analytics
- Meeting reactions (emoji, hand raise, applause)
- Waiting room with customizable message
- Virtual backgrounds (blur, presets, custom, chroma key)
- AI Eye Contact correction (TensorFlow.js)
- Recording studio (local + cloud, screencast, PiP)
- Whiteboard (draw, shapes, text, images, laser pointer)
- Live captions & translation (100+ languages)
- Noise suppression
- Speaker stats & talk time tracking
- Keyboard shortcuts
- Phone/SIP dial-in (Jitsi-compatible)
- Webinar mode (up to 10K attendees, panelist controls)
- Live streaming to YouTube/Twitch/Custom RTMP
- Meeting templates & scheduling

### 💬 Chat & Collaboration
- Real-time channels (public, private, DM)
- Threads, reactions, file sharing
- Message search & pinning
- @mentions and notifications

### 📄 Documents
- Collaborative document editor
- Version history
- File storage (S3)
- YouTube URL import

### ✅ Tasks
- Kanban boards
- Due dates, assignees, priorities
- Task dependencies

### 📚 LMS (Learning Management)
- Course builder with lessons & modules
- Quiz engine (MCQ, true/false, short answer, matching, ordering)
- Question bank with tagging & difficulty
- Auto & manual grading with rubrics
- Certificates (auto-generated, downloadable)
- Gamification (points, badges, XP, streaks, leaderboard)
- Discussion forums with threads
- Gradebook (instructor spreadsheet + student view)
- Learning paths (sequential course progression)
- Attendance tracking with export
- Peer review (anonymous, rubric-based)
- SCORM 1.2 player with progress tracking
- Course announcements with pinning
- Course calendar with iCal export

### 🤖 AI Studio
- AI-powered content generation
- Meeting summarization
- Smart search

### 🔧 Platform
- Real-time notification center (SSE)
- Global search (Cmd+K) across all content
- User profiles with status & activity feed
- User settings (8 tabs: General, Notifications, A/V, Appearance, Privacy, Security, Integrations, Accessibility)
- Admin dashboard with analytics charts
- User management (bulk actions, CSV import/export)
- System settings & feature flags
- Two-factor authentication (TOTP + backup codes)
- PWA support (offline, installable, push notifications)
- Dark/Light/System theme with smooth transitions
- Accessibility toolbar (font size, high contrast, reduced motion, dyslexia font, keyboard shortcuts)
- Email verification & password reset
- Role-based access control (Student, Instructor, Admin)

---

## 🔒 Security Checklist

- [x] NextAuth.js with JWT sessions
- [x] CSRF protection (built into NextAuth)
- [x] Two-factor authentication (TOTP)
- [x] Email verification on registration
- [x] Password reset with expiring tokens
- [x] Rate limiting on auth endpoints
- [x] Role-based access control
- [x] API route authentication checks
- [x] Environment variables for all secrets
- [x] SQL injection prevention (Prisma ORM)
- [ ] Add rate limiting middleware (recommended: `next-rate-limit`)
- [ ] Add Content Security Policy headers
- [ ] Enable Vercel DDoS protection
- [ ] Set up monitoring (Sentry, LogRocket)

---

## 🛠️ Maintenance

```bash
# Update dependencies
npm update

# Run Prisma Studio (visual DB editor)
npx prisma studio

# Generate new migration after schema changes
npx prisma migrate dev --name description

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset
```

---

## 📱 Social Media Configuration

NexusLearn includes a built-in Social Media module for sharing content, scheduling posts, and tracking engagement across platforms.

### Twitter/X Developer Setup
1. Go to [developer.twitter.com](https://developer.twitter.com/) and create a project/app
2. Enable **OAuth 2.0** (User Authentication Settings)
3. Set callback URL: `https://yourdomain.com/api/auth/callback/twitter`
4. Enable scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`
5. Copy **Client ID** and **Client Secret** to `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET`
6. For API posting, also set `TWITTER_API_KEY` and `TWITTER_API_SECRET` from the Keys & Tokens tab

### Facebook/Meta Developer Setup
1. Go to [developers.facebook.com](https://developers.facebook.com/) and create an app (type: Business)
2. Add **Facebook Login** product
3. Set Valid OAuth Redirect URI: `https://yourdomain.com/api/auth/callback/facebook`
4. Under Settings → Basic, copy **App ID** and **App Secret**
5. Set `FACEBOOK_CLIENT_ID` (App ID), `FACEBOOK_CLIENT_SECRET` (App Secret), and `FACEBOOK_APP_ID`
6. For Instagram integration, add the **Instagram Graph API** product and set `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET`
7. Required permissions: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`

### LinkedIn Developer Setup
1. Go to [linkedin.com/developers](https://www.linkedin.com/developers/) and create an app
2. Under **Auth** tab, add redirect URL: `https://yourdomain.com/api/auth/callback/linkedin`
3. Request the following products: **Share on LinkedIn**, **Sign In with LinkedIn using OpenID Connect**
4. Copy **Client ID** and **Client Secret** to `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`
5. Required scopes: `openid`, `profile`, `email`, `w_member_social`

### OAuth Callback URLs Summary
Configure these callback URLs in each platform's developer console:

| Platform | Callback URL |
|----------|-------------|
| Twitter/X | `https://yourdomain.com/api/auth/callback/twitter` |
| Facebook | `https://yourdomain.com/api/auth/callback/facebook` |
| LinkedIn | `https://yourdomain.com/api/auth/callback/linkedin` |
| Instagram | Uses Facebook app (same callback) |

> **Note:** For local development, use `http://localhost:3000` instead of `https://yourdomain.com`.

### Social Features
- **Share to Social**: Quick-share recordings, certificates, courses, and webinar links
- **Post Scheduler**: Calendar-based scheduling with multi-platform support
- **Auto-Announcements**: Trigger-based automatic posting (e.g., when a course is published)
- **Social Analytics**: Track impressions, engagement, and top-performing posts
- **Social Login**: Sign in with Twitter, Facebook, or LinkedIn (in addition to Google, GitHub, Apple)

---

## 💳 Stripe & Billing Configuration

### 1. Create Stripe Account
1. Sign up at [stripe.com](https://stripe.com) and complete onboarding
2. Note your **Publishable Key** and **Secret Key** from the [API Keys](https://dashboard.stripe.com/apikeys) page

### 2. Create Products & Prices
In the Stripe Dashboard → Products:
1. Create a **Pro** product
   - Add a **Monthly** recurring price: $15.00/month per unit
   - Add a **Yearly** recurring price: $144.00/year per unit
2. Copy the Price IDs (e.g., `price_xxx`) to your environment variables

### 3. Configure Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Webhook Signing Secret** to `STRIPE_WEBHOOK_SECRET`

### 4. Environment Variables
```bash
STRIPE_SECRET_KEY=sk_live_...          # or sk_test_... for testing
STRIPE_PUBLISHABLE_KEY=pk_live_...     # or pk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...  # Pro monthly price ID
STRIPE_PRO_YEARLY_PRICE_ID=price_...   # Pro yearly price ID
```

### 5. Seed Plans
After setting up the database, seed the default plans:
```bash
npx prisma db seed
```

This creates the Free, Pro, and Enterprise plans with all feature flags and limits.

### 6. Customer Portal (Optional)
Configure the Stripe Customer Portal at Dashboard → Settings → Billing → Customer Portal to allow users to manage their payment methods and download invoices directly.

---

## 📈 Scaling Tips

1. **Database**: Use Supabase Pro or PlanetScale for connection pooling
2. **Video**: Scale LiveKit with multiple media servers
3. **Storage**: Use CloudFront CDN in front of S3
4. **Caching**: Add Redis for session storage and real-time features
5. **Search**: Replace Prisma full-text with Algolia or Meilisearch for better performance
6. **Monitoring**: Add Sentry for error tracking, Vercel Analytics for performance

---

Built with ❤️ by NexusLearn
