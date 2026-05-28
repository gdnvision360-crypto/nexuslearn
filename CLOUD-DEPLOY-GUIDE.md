# NexusLearn — Cloud Deploy Guide (Free Tiers)

Deploy NexusLearn to the cloud so your team can test it from anywhere — all using free tiers.

---

## Architecture Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Vercel          │     │   Neon / Supabase │     │   Uploadthing    │
│   (App Hosting)   │────▶│   (PostgreSQL DB) │     │   (File Storage) │
│   FREE            │     │   FREE            │     │   FREE 2GB       │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│   LiveKit Cloud   │     │   Stripe          │
│   (Video/Audio)   │     │   (Payments)      │
│   FREE tier       │     │   TEST mode free  │
└──────────────────┘     └──────────────────┘
```

---

## Step 1: Set Up the Database (Neon — Recommended)

### 1.1 Create Neon Account
1. Go to https://neon.tech
2. Sign up (free — no credit card)
3. Click **Create Project**
4. Name it `nexuslearn`
5. Select your nearest region
6. Click **Create Project**

### 1.2 Get Connection URL
1. On the dashboard, find your **Connection String**
2. It looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/nexuslearn?sslmode=require`
3. Copy it — you'll need it in Step 3

### Alternative: Supabase
1. Go to https://supabase.com
2. Create a project
3. Go to **Settings > Database > Connection String**
4. Copy the URI (replace `[YOUR-PASSWORD]` with your DB password)

---

## Step 2: Deploy to Vercel

### 2.1 Prepare Your Code

**Option A: GitHub (Recommended)**
1. Create a GitHub repository
2. Push the NexusLearn code:
```bash
cd nexuslearn
git init
git add .
git commit -m "Initial NexusLearn deploy"
git remote add origin https://github.com/YOUR_USERNAME/nexuslearn.git
git push -u origin main
```

**Option B: Direct Upload via Vercel CLI**
```bash
npm install -g vercel
cd nexuslearn
vercel
```

### 2.2 Deploy on Vercel
1. Go to https://vercel.com
2. Sign up / Log in (free with GitHub)
3. Click **Add New > Project**
4. Import your GitHub repository
5. **Framework Preset**: Next.js (auto-detected)
6. Click **Deploy**

### 2.3 Configure Environment Variables
In Vercel dashboard:
1. Go to your project **Settings > Environment Variables**
2. Add these variables:

```
DATABASE_URL = postgresql://user:pass@ep-xxx.neon.tech/nexuslearn?sslmode=require
NEXTAUTH_URL = https://your-app-name.vercel.app
NEXTAUTH_SECRET = [run: openssl rand -base64 32]
```

3. Add optional variables as needed (see LOCAL-SETUP-GUIDE.md for full list)
4. Click **Save**
5. Go to **Deployments** and click **Redeploy**

### 2.4 Initialize Database
After first deploy, run from your local machine:
```bash
# Set the cloud DATABASE_URL temporarily
export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/nexuslearn?sslmode=require"

# Push schema to cloud database
npx prisma db push

# (Optional) Seed with sample data
npx prisma db seed
```

---

## Step 3: Set Up Video Conferencing (LiveKit Cloud)

1. Go to https://cloud.livekit.io
2. Sign up (free tier: 50 monthly participants)
3. Create a project
4. Go to **Settings > Keys**
5. Copy your API Key and Secret
6. Add to Vercel environment variables:
```
LIVEKIT_API_KEY = your_api_key
LIVEKIT_API_SECRET = your_api_secret
LIVEKIT_URL = wss://your-project.livekit.cloud
```
7. Redeploy on Vercel

---

## Step 4: Set Up File Storage

### Option A: Uploadthing (Easiest)
1. Go to https://uploadthing.com
2. Sign up (free: 2 GB)
3. Create an app
4. Copy your API key
5. Add to Vercel:
```
UPLOADTHING_SECRET = your_secret
UPLOADTHING_APP_ID = your_app_id
```

### Option B: AWS S3 (More Storage)
1. Create an AWS account (free tier: 5 GB)
2. Create an S3 bucket
3. Create an IAM user with S3 access
4. Add to Vercel:
```
S3_BUCKET = nexuslearn-files
S3_REGION = us-east-1
S3_ACCESS_KEY = your_access_key
S3_SECRET_KEY = your_secret_key
```

---

## Step 5: Set Up Stripe (Test Mode)

1. Go to https://dashboard.stripe.com
2. Sign up (free — no charges in test mode)
3. Toggle **Test Mode** (top right)
4. Go to **Developers > API Keys**
5. Copy your keys
6. Add to Vercel:
```
STRIPE_SECRET_KEY = sk_test_...
STRIPE_PUBLISHABLE_KEY = pk_test_...
```

### Set Up Stripe Webhook
1. In Stripe, go to **Developers > Webhooks**
2. Add endpoint: `https://your-app.vercel.app/api/billing/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
4. Copy the webhook signing secret
5. Add to Vercel:
```
STRIPE_WEBHOOK_SECRET = whsec_...
```

### Test Cards
Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

---

## Step 6: Set Up OAuth Providers

### Google OAuth
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
4. Add to Vercel:
```
GOOGLE_CLIENT_ID = your_client_id
GOOGLE_CLIENT_SECRET = your_client_secret
```

### GitHub OAuth
1. Go to https://github.com/settings/developers
2. Create New OAuth App
3. Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`
4. Add to Vercel:
```
GITHUB_CLIENT_ID = your_client_id
GITHUB_CLIENT_SECRET = your_client_secret
```

---

## Step 7: Set Up Email (SMTP)

### Gmail (Quick)
1. Enable 2FA on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password
4. Add to Vercel:
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASSWORD = your-app-password
EMAIL_FROM = noreply@nexuslearn.com
```

### Alternative: Resend (Free 100 emails/day)
1. Go to https://resend.com
2. Sign up and get API key
3. Add to Vercel:
```
RESEND_API_KEY = re_...
```

---

## Step 8: Custom Domain (Optional)

1. Buy a domain (Namecheap, Google Domains, Cloudflare)
2. In Vercel: **Settings > Domains > Add**
3. Add your domain (e.g., `nexuslearn.com`)
4. Update DNS records as shown by Vercel
5. Update `NEXTAUTH_URL` to your new domain
6. Update OAuth redirect URIs to use new domain
7. Redeploy

---

## Cost Summary

| Service | Free Tier | When to Upgrade |
|---------|-----------|----------------|
| **Vercel** | 100 GB bandwidth, serverless functions | 100+ concurrent users |
| **Neon** | 512 MB storage, auto-suspend | 500+ users |
| **LiveKit** | 50 participants/month | Paid events/classes |
| **Uploadthing** | 2 GB storage | Heavy file sharing |
| **Stripe** | Test mode unlimited | Going live with payments |
| **Gmail SMTP** | 500 emails/day | Use Resend/SendGrid for more |

**Total cost for testing: $0**

---

## Verification Checklist

After deploying, verify:
- [ ] Landing page loads at your URL
- [ ] Can register a new account
- [ ] Can log in
- [ ] Dashboard loads
- [ ] Can create a course
- [ ] Can schedule a meeting
- [ ] Video/audio works (if LiveKit configured)
- [ ] File upload works (if storage configured)
- [ ] Stripe checkout works in test mode
- [ ] Email delivery works

---

## Sharing with Your Team

Once deployed, share the URL with your team:
1. Send them `https://your-app.vercel.app`
2. They can register their own accounts
3. Make testers admins via Prisma Studio or direct DB update

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'tester@example.com';
```

---

## Next Steps

1. Follow the **QA-TESTING-CHECKLIST.md** for systematic testing
2. When ready for production, see **DEPLOYMENT-GUIDE.md** for dedicated server setup
3. Configure a custom domain for professional branding
