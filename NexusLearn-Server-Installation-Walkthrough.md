# NexusLearn — Complete Server Installation Walkthrough

> A hands-on, command-by-command guide to getting NexusLearn fully running on your own server.
> Every step includes the exact commands to type. Nothing is skipped.

---

## 📋 BEFORE YOU START

### What You Need:
| Item | Minimum | Recommended |
|------|---------|-------------|
| **RAM** | 2 GB | 4 GB+ |
| **Storage** | 10 GB free | 50 GB+ |
| **CPU** | 2 cores | 4 cores+ |
| **OS** | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 LTS |
| **Internet** | Any broadband | Static IP preferred |
| **Domain** (optional) | — | e.g. `app.nexuslearn.com` |

### What Gets Installed:
- **Node.js 20** — runs the application
- **PostgreSQL 16** — the database (86 tables)
- **Redis** — caching & real-time features
- **Nginx** — web server & reverse proxy
- **PM2** — keeps app running 24/7
- **Certbot** — free SSL certificate (HTTPS)

---

## PHASE 1: PREPARE YOUR SERVER

### Step 1.1 — Open Terminal

**On Ubuntu/Debian Linux:**
```bash
# Press Ctrl+Alt+T to open terminal
# Or open "Terminal" from applications menu
```

**On Windows (using WSL):**
```bash
# Open PowerShell as Administrator and install WSL:
wsl --install -d Ubuntu-22.04

# Restart computer, then open "Ubuntu" from Start menu
```

**On Mac:**
```bash
# Press Cmd+Space, type "Terminal", press Enter
```

### Step 1.2 — Update Your System

```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y
```

You'll be asked for your password. Type it (it won't show on screen) and press Enter.

**Expected output:** Lists of packages being updated. Takes 1–5 minutes.

### Step 1.3 — Install Essential Tools

```bash
sudo apt install -y curl wget git unzip build-essential
```

**Expected output:** `Setting up curl... Setting up git...` etc.

---

## PHASE 2: INSTALL NODE.js 20

### Step 2.1 — Add Node.js Repository

```bash
# Download and run the Node.js 20 setup script
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

**Expected output:** `## Installing the NodeSource Node.js 20.x repo...`

### Step 2.2 — Install Node.js

```bash
sudo apt install -y nodejs
```

### Step 2.3 — Verify Installation

```bash
node --version
# Should show: v20.x.x

npm --version
# Should show: 10.x.x
```

✅ **Checkpoint:** Both commands should show version numbers. If not, re-run Step 2.1.

---

## PHASE 3: INSTALL & CONFIGURE POSTGRESQL DATABASE

### Step 3.1 — Install PostgreSQL 16

```bash
# Add PostgreSQL official repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Add the repository signing key
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update and install
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16
```

### Step 3.2 — Start PostgreSQL

```bash
# Start the database service
sudo systemctl start postgresql

# Enable it to start on boot
sudo systemctl enable postgresql

# Check it's running
sudo systemctl status postgresql
```

**Expected output:** Should show `active (running)` in green.

### Step 3.3 — Create the NexusLearn Database & User

```bash
# Switch to the postgres system user
sudo -u postgres psql
```

You're now inside the PostgreSQL shell (prompt shows `postgres=#`). Type these commands **one at a time**:

```sql
-- Create a dedicated user for NexusLearn
CREATE USER nexuslearn WITH PASSWORD 'YourStrongPassword123!';

-- Create the database
CREATE DATABASE nexuslearn_db OWNER nexuslearn;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE nexuslearn_db TO nexuslearn;

-- Exit PostgreSQL shell
\q
```

⚠️ **IMPORTANT:** Replace `YourStrongPassword123!` with your own strong password. **Write it down** — you'll need it in Phase 5.

### Step 3.4 — Verify Database Connection

```bash
# Test connecting with the new user
psql -U nexuslearn -d nexuslearn_db -h localhost -W
```

Type your password when prompted. If you see `nexuslearn_db=>` prompt, it works! Type `\q` to exit.

✅ **Checkpoint:** You can connect to the database. If you get "authentication failed", repeat Step 3.3 with the correct password.

---

## PHASE 4: INSTALL REDIS (Caching & Real-Time)

### Step 4.1 — Install Redis

```bash
sudo apt install -y redis-server
```

### Step 4.2 — Configure Redis

```bash
# Open the Redis config file
sudo nano /etc/redis/redis.conf
```

Find and change these lines:
```
# Find this line:
supervised no
# Change to:
supervised systemd

# Find this line:
# maxmemory <bytes>
# Change to (set to 256MB):
maxmemory 256mb

# Find this line:
# maxmemory-policy noeviction
# Change to:
maxmemory-policy allkeys-lru
```

**How to edit in nano:**
- Use arrow keys to navigate
- `Ctrl+W` to search for text
- Make your changes
- `Ctrl+O` then `Enter` to save
- `Ctrl+X` to exit

### Step 4.3 — Restart Redis

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Verify it's running
redis-cli ping
```

**Expected output:** `PONG`

✅ **Checkpoint:** Redis responds with PONG.

---

## PHASE 5: UPLOAD & CONFIGURE NEXUSLEARN

### Step 5.1 — Create Application Directory

```bash
# Create the app directory
sudo mkdir -p /var/www/nexuslearn

# Set ownership to your user
sudo chown -R $USER:$USER /var/www/nexuslearn

# Navigate to it
cd /var/www/nexuslearn
```

### Step 5.2 — Upload Your Files

**Option A: Transfer the ZIP from your computer (recommended)**

From **your local computer** (not the server), open a new terminal:

```bash
# From your local machine — replace YOUR_SERVER_IP
scp ~/Downloads/nexuslearn-production.zip YOUR_USERNAME@YOUR_SERVER_IP:/var/www/nexuslearn/
```

**Option B: If the server IS your computer**
Simply copy the ZIP:
```bash
cp ~/Downloads/nexuslearn-production.zip /var/www/nexuslearn/
```

### Step 5.3 — Extract the Files

```bash
cd /var/www/nexuslearn

# Unzip the production files
unzip nexuslearn-production.zip

# Verify files are there
ls -la
```

**Expected output:** You should see folders like `src/`, `prisma/`, `public/`, and files like `package.json`, `next.config.js`, etc.

### Step 5.4 — Install Dependencies

```bash
# Install all Node.js packages
npm install
```

**Expected output:** This downloads ~500+ packages. Takes 2–5 minutes. Should end with `added XXX packages`.

⚠️ If you see errors about `node-gyp` or `python`, run:
```bash
sudo apt install -y python3 g++ make
npm install
```

### Step 5.5 — Create the Environment File

This is the most important file — it tells NexusLearn how to connect to everything:

```bash
# Create the .env file
nano .env
```

Paste this entire block, then **edit each value**:

```env
# ============================================
# DATABASE
# ============================================
# Replace password with what you set in Step 3.3
DATABASE_URL="postgresql://nexuslearn:YourStrongPassword123!@localhost:5432/nexuslearn_db"

# ============================================
# APPLICATION
# ============================================
NEXTAUTH_URL="http://localhost:3000"
# Generate a random secret — run this command separately:
#   openssl rand -base64 32
# Then paste the result here:
NEXTAUTH_SECRET="paste-your-generated-secret-here"

# ============================================
# REDIS
# ============================================
REDIS_URL="redis://localhost:6379"

# ============================================
# FILE STORAGE (Choose one)
# ============================================
# Option 1: Local storage (simplest — files saved on your server)
STORAGE_TYPE="local"
UPLOAD_DIR="/var/www/nexuslearn/uploads"

# Option 2: AWS S3 (for production scale)
# STORAGE_TYPE="s3"
# AWS_ACCESS_KEY_ID="your-aws-key"
# AWS_SECRET_ACCESS_KEY="your-aws-secret"
# AWS_S3_BUCKET="nexuslearn-files"
# AWS_REGION="us-east-1"

# ============================================
# EMAIL (For sending invites, password resets)
# ============================================
# Gmail example — use an App Password, not your regular password
# See: https://myaccount.google.com/apppasswords
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
SMTP_FROM="NexusLearn <your-email@gmail.com>"

# ============================================
# OAUTH LOGIN (Optional — add what you need)
# ============================================
# Google Login — https://console.cloud.google.com/apis/credentials
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub Login — https://github.com/settings/developers
# GITHUB_CLIENT_ID="your-github-client-id"
# GITHUB_CLIENT_SECRET="your-github-client-secret"

# ============================================
# VIDEO CONFERENCING (LiveKit)
# ============================================
# Self-host LiveKit: https://docs.livekit.io/oss/deployment/
# Or use LiveKit Cloud: https://cloud.livekit.io (free tier available)
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"
LIVEKIT_URL="ws://localhost:7880"

# ============================================
# AI FEATURES (Optional)
# ============================================
# OPENAI_API_KEY="sk-your-openai-key"
# ELEVENLABS_API_KEY="your-elevenlabs-key"

# ============================================
# STRIPE PAYMENTS (Optional)
# ============================================
# STRIPE_SECRET_KEY="sk_live_your-key"
# STRIPE_PUBLISHABLE_KEY="pk_live_your-key"
# STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# ============================================
# YOUTUBE DOWNLOAD
# ============================================
YTDLP_PATH="/usr/local/bin/yt-dlp"
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### Step 5.6 — Generate the NEXTAUTH_SECRET

```bash
# Run this to generate a random secret
openssl rand -base64 32
```

**Copy the output** and paste it as the value for `NEXTAUTH_SECRET` in your `.env` file:

```bash
# Re-open .env and replace the placeholder
nano .env
```

### Step 5.7 — Create Upload Directory

```bash
mkdir -p /var/www/nexuslearn/uploads
chmod 755 /var/www/nexuslearn/uploads
```

### Step 5.8 — Install yt-dlp (YouTube Downloads)

```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Verify
yt-dlp --version
```

✅ **Checkpoint:** Your `.env` file is configured with your database password and generated secret.

---

## PHASE 6: SET UP THE DATABASE (86 Tables)

### Step 6.1 — Generate Prisma Client

```bash
# Generate the database client code
npx prisma generate
```

**Expected output:** `✔ Generated Prisma Client`

### Step 6.2 — Create All 86 Database Tables

```bash
# Push the schema to your database — creates all tables
npx prisma db push
```

**Expected output:**
```
🚀 Your database is now in sync with your Prisma schema.
```

This creates all 86 tables including:
- Users, Accounts, Sessions (authentication)
- Courses, Lessons, Quizzes, Certificates (LMS)
- Meetings, MeetingParticipants, Breakout rooms (conferencing)
- VideoProjects, VideoScenes, VideoCaptions (Video Studio)
- Subscriptions, Invoices, Coupons (billing)
- And 70+ more...

### Step 6.3 — Verify Tables Were Created

```bash
# Connect to the database
psql -U nexuslearn -d nexuslearn_db -h localhost -W
```

Inside the PostgreSQL shell:
```sql
-- List all tables
\dt

-- Count tables (should show 86)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Exit
\q
```

✅ **Checkpoint:** You should see 86 tables listed.

### Step 6.4 — (Optional) Seed Sample Data

```bash
# If a seed file exists, populate with sample data
npx prisma db seed
```

If there's no seed script, you'll create the first user through the web interface after launching.

---

## PHASE 7: BUILD & LAUNCH THE APPLICATION

### Step 7.1 — Build the Production App

```bash
# Build the optimized production version
npm run build
```

**Expected output:** Takes 2–5 minutes. Should end with:
```
✓ Compiled successfully
Route (app)    Size    First Load JS
...
```

⚠️ If you see build errors:
```bash
# Common fix: increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Step 7.2 — Test It Locally First

```bash
# Start the production server
npm run start
```

**Expected output:** `▲ Next.js 14.x.x` and `Ready on http://localhost:3000`

Open a browser and go to: `http://localhost:3000` (or `http://YOUR_SERVER_IP:3000`)

✅ **Checkpoint:** You should see the NexusLearn login/landing page!

Press `Ctrl+C` to stop (we'll use PM2 next for permanent running).

---

## PHASE 8: KEEP IT RUNNING 24/7 WITH PM2

### Step 8.1 — Install PM2

```bash
sudo npm install -g pm2
```

### Step 8.2 — Create PM2 Configuration

```bash
nano /var/www/nexuslearn/ecosystem.config.js
```

Paste:

```javascript
module.exports = {
  apps: [{
    name: 'nexuslearn',
    script: 'npm',
    args: 'run start',
    cwd: '/var/www/nexuslearn',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logging
    error_file: '/var/www/nexuslearn/logs/error.log',
    out_file: '/var/www/nexuslearn/logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
};
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

### Step 8.3 — Create Logs Directory

```bash
mkdir -p /var/www/nexuslearn/logs
```

### Step 8.4 — Start with PM2

```bash
cd /var/www/nexuslearn

# Start the app
pm2 start ecosystem.config.js

# Check it's running
pm2 status
```

**Expected output:**
```
┌─────────────┬────┬─────────┬──────┬───────┐
│ App name    │ id │ status  │ cpu  │ memory│
├─────────────┼────┼─────────┼──────┼───────┤
│ nexuslearn  │ 0  │ online  │ 0%   │ 120MB │
└─────────────┴────┴─────────┴──────┴───────┘
```

### Step 8.5 — Auto-Start on Reboot

```bash
# Generate startup script
pm2 startup

# It will show a command — COPY AND RUN that exact command
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u yourusername --hp /home/yourusername

# Save current process list
pm2 save
```

Now NexusLearn will **automatically restart** when your server reboots!

### Step 8.6 — Useful PM2 Commands

```bash
pm2 status              # Check app status
pm2 logs nexuslearn     # View live logs
pm2 restart nexuslearn  # Restart the app
pm2 stop nexuslearn     # Stop the app
pm2 monit               # Real-time monitoring dashboard
```

---

## PHASE 9: SET UP NGINX (Web Server & Reverse Proxy)

### Step 9.1 — Install Nginx

```bash
sudo apt install -y nginx
```

### Step 9.2 — Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/nexuslearn
```

**If you DON'T have a domain yet** (access via IP address):
```nginx
server {
    listen 80;
    server_name _;

    # Max upload size (for file sharing)
    client_max_body_size 500M;

    # WebSocket support (required for video calls & real-time)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings for long-running connections (video calls)
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Serve uploaded files directly
    location /uploads {
        alias /var/www/nexuslearn/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**If you HAVE a domain** (e.g. `app.nexuslearn.com`):
```nginx
server {
    listen 80;
    server_name app.nexuslearn.com;

    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /uploads {
        alias /var/www/nexuslearn/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Save and exit.

### Step 9.3 — Enable the Site

```bash
# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/nexuslearn /etc/nginx/sites-enabled/

# Remove the default site
sudo rm /etc/nginx/sites-enabled/default

# Test the configuration
sudo nginx -t
```

**Expected output:** `nginx: configuration file /etc/nginx/nginx.conf test is successful`

### Step 9.4 — Restart Nginx

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 9.5 — Test Access

Open a browser and go to:
- `http://YOUR_SERVER_IP` (without :3000 this time!)
- Or `http://app.nexuslearn.com` if you have a domain

✅ **Checkpoint:** NexusLearn loads without the `:3000` port number.

---

## PHASE 10: SSL CERTIFICATE (HTTPS) — Required for Video Calls

⚠️ **Video/audio calls require HTTPS.** Browsers block camera/microphone on non-HTTPS sites.

### Step 10.1 — Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 10.2 — Get Free SSL Certificate

**You MUST have a domain name pointing to your server for this to work.**

```bash
# Replace with your actual domain
sudo certbot --nginx -d app.nexuslearn.com
```

Follow the prompts:
1. Enter your email address
2. Agree to terms: `Y`
3. Share email with EFF: `N` (optional)
4. Redirect HTTP to HTTPS: Choose `2` (redirect)

**Expected output:** `Congratulations! Your certificate and chain have been saved`

### Step 10.3 — Update NEXTAUTH_URL

```bash
nano /var/www/nexuslearn/.env
```

Change:
```env
# FROM:
NEXTAUTH_URL="http://localhost:3000"

# TO:
NEXTAUTH_URL="https://app.nexuslearn.com"
```

Save and restart:
```bash
pm2 restart nexuslearn
```

### Step 10.4 — Auto-Renew SSL

```bash
# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot automatically renews every 60 days. No action needed.

✅ **Checkpoint:** `https://app.nexuslearn.com` loads with a padlock icon.

---

## PHASE 11: FIREWALL SECURITY

### Step 11.1 — Configure UFW Firewall

```bash
# Allow SSH (so you don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow LiveKit (video conferencing) if self-hosting LiveKit
# sudo ufw allow 7880/tcp
# sudo ufw allow 7881/tcp
# sudo ufw allow 50000:60000/udp

# Enable the firewall
sudo ufw enable

# Check status
sudo ufw status
```

**Expected output:**
```
Status: active
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## PHASE 12: AUTOMATED BACKUPS

### Step 12.1 — Create Backup Script

```bash
sudo nano /usr/local/bin/nexuslearn-backup.sh
```

Paste:
```bash
#!/bin/bash
# NexusLearn Daily Backup Script

BACKUP_DIR="/var/www/nexuslearn/backups"
DATE=$(date +%Y-%m-%d_%H-%M)
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD="YourStrongPassword123!" pg_dump -U nexuslearn -h localhost nexuslearn_db > "$BACKUP_DIR/db_$DATE.sql"

# Backup uploaded files
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C /var/www/nexuslearn/uploads .

# Backup .env file
cp /var/www/nexuslearn/.env "$BACKUP_DIR/env_$DATE.bak"

# Delete backups older than 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

Save and make executable:
```bash
sudo chmod +x /usr/local/bin/nexuslearn-backup.sh
```

### Step 12.2 — Schedule Daily Backups

```bash
# Open crontab editor
sudo crontab -e
```

Add this line at the bottom:
```
0 2 * * * /usr/local/bin/nexuslearn-backup.sh >> /var/www/nexuslearn/logs/backup.log 2>&1
```

This runs the backup every day at 2:00 AM.

### Step 12.3 — Test Backup

```bash
sudo /usr/local/bin/nexuslearn-backup.sh
ls -la /var/www/nexuslearn/backups/
```

✅ **Checkpoint:** You should see `.sql`, `.tar.gz`, and `.bak` files.

---

## 🎯 FINAL VERIFICATION CHECKLIST

Run through this checklist to confirm everything works:

```
□ http(s)://yoursite.com loads the login page
□ Can create a new account (registration form)
□ Can log in with email/password
□ Can log in with Google/GitHub (if configured)
□ Can create a course
□ Can upload a file
□ Can start a video meeting (requires HTTPS)
□ Camera and microphone work
□ Can share screen
□ Can send chat messages
□ PM2 shows app as "online" (pm2 status)
□ Nginx is running (sudo systemctl status nginx)
□ PostgreSQL is running (sudo systemctl status postgresql)
□ Redis is running (redis-cli ping → PONG)
□ SSL certificate is valid (padlock in browser)
□ Backups are working (check /var/www/nexuslearn/backups/)
```

---

## 🔧 TROUBLESHOOTING

### App won't start
```bash
# Check PM2 logs
pm2 logs nexuslearn --lines 50

# Check if port 3000 is in use
sudo lsof -i :3000

# Kill stuck process
sudo kill -9 $(sudo lsof -t -i:3000)
pm2 restart nexuslearn
```

### Database connection error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U nexuslearn -d nexuslearn_db -h localhost -W

# Check your DATABASE_URL in .env matches
cat /var/www/nexuslearn/.env | grep DATABASE
```

### "502 Bad Gateway" from Nginx
```bash
# Check if the app is running
pm2 status

# Check Nginx error log
sudo tail -20 /var/log/nginx/error.log

# Restart everything
pm2 restart nexuslearn
sudo systemctl restart nginx
```

### Video calls don't work
```bash
# Camera/mic requires HTTPS — check SSL
curl -I https://yoursite.com

# Check LiveKit configuration in .env
cat .env | grep LIVEKIT

# Check WebSocket connection in browser console (F12)
```

### Build fails with memory error
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Permission denied errors
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/nexuslearn
```

---

## 📊 QUICK REFERENCE CARD

```
┌─────────────────────────────────────────────────────┐
│              NexusLearn Server Commands              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  APP MANAGEMENT                                     │
│  pm2 status              → Check app status         │
│  pm2 restart nexuslearn  → Restart app              │
│  pm2 logs nexuslearn     → View live logs           │
│  pm2 monit               → Monitoring dashboard     │
│                                                     │
│  DATABASE                                           │
│  psql -U nexuslearn -d nexuslearn_db -h localhost   │
│  npx prisma studio       → Visual DB browser        │
│  npx prisma db push      → Apply schema changes     │
│                                                     │
│  SERVICES                                           │
│  sudo systemctl status postgresql                   │
│  sudo systemctl status nginx                        │
│  sudo systemctl status redis-server                 │
│                                                     │
│  UPDATES                                            │
│  cd /var/www/nexuslearn                             │
│  npm install             → Install new packages     │
│  npm run build           → Rebuild the app          │
│  pm2 restart nexuslearn  → Apply changes            │
│                                                     │
│  BACKUPS                                            │
│  /usr/local/bin/nexuslearn-backup.sh → Manual run   │
│  ls /var/www/nexuslearn/backups/     → View backups │
│                                                     │
│  PATHS                                              │
│  App:     /var/www/nexuslearn                       │
│  Config:  /var/www/nexuslearn/.env                  │
│  Uploads: /var/www/nexuslearn/uploads               │
│  Logs:    /var/www/nexuslearn/logs                  │
│  Backups: /var/www/nexuslearn/backups               │
│  Nginx:   /etc/nginx/sites-available/nexuslearn     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 UPDATING NEXUSLEARN IN THE FUTURE

When you get a new version:

```bash
# 1. Backup first!
sudo /usr/local/bin/nexuslearn-backup.sh

# 2. Upload new ZIP
cd /var/www/nexuslearn
# (upload new zip via scp or copy)

# 3. Extract (preserving .env and uploads)
cp .env .env.backup
cp -r uploads uploads_backup
unzip -o nexuslearn-production-v2.zip

# 4. Restore your config
cp .env.backup .env
cp -r uploads_backup/* uploads/

# 5. Install dependencies & rebuild
npm install
npx prisma generate
npx prisma db push
npm run build

# 6. Restart
pm2 restart nexuslearn
```

---

> 💡 **Total setup time: ~60–90 minutes** for first-time deployment.
> After that, updates take ~5 minutes.

*NexusLearn — Your platform, your server, your data.* 🎓🚀
