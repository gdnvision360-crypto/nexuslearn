# NexusLearn — Deploy to Your Own Server (Self-Hosted Guide)

## Complete Step-by-Step Guide to Host NexusLearn on Your Own VPS/Server

> **Time:** 2–3 hours | **Monthly Cost:** $5–$20 | **Full Control:** You own everything

---

## 🎯 Why Self-Host?

| Benefit | Details |
|---------|---------|
| **Full control** | Your server, your rules — no platform limits |
| **Custom domain** | `app.nexuslearn.com` or any domain you own |
| **No vendor lock-in** | Move between hosts anytime |
| **Better performance** | Dedicated resources, no cold starts |
| **Data privacy** | All data stays on YOUR server |
| **Unlimited bandwidth** | No Vercel bandwidth caps |
| **Lower cost at scale** | Cheaper than Vercel Pro at 100+ users |

---

## 📋 What You Need Before Starting

| Item | Purpose | Cost |
|------|---------|------|
| **VPS Server** | Host the app | $5–$20/month |
| **Domain Name** | Public URL | $10–$15/year |
| **NexusLearn ZIP** | Your production codebase | ✅ Already have it |
| **SSH client** | Connect to server | Free (built into Mac/Linux/Windows) |

---

## PHASE 1: GET A SERVER (15 minutes)

### Step 1: Choose a VPS Provider

Pick one of these affordable providers:

| Provider | Cheapest Plan | RAM | Storage | Link |
|----------|--------------|-----|---------|------|
| **DigitalOcean** | $6/month | 1 GB | 25 GB SSD | https://digitalocean.com |
| **Hetzner** | €4.51/month | 2 GB | 20 GB | https://hetzner.com/cloud |
| **Vultr** | $6/month | 1 GB | 25 GB SSD | https://vultr.com |
| **Linode (Akamai)** | $5/month | 1 GB | 25 GB | https://linode.com |
| **AWS Lightsail** | $5/month | 1 GB | 40 GB | https://lightsail.aws.amazon.com |
| **Oracle Cloud** | FREE forever | 1 GB | 50 GB | https://cloud.oracle.com |

> 💡 **Recommended:** DigitalOcean $12/month (2 GB RAM) for smooth performance, or Oracle Cloud free tier for testing.

### Step 2: Create a Server

Using DigitalOcean as example (similar for all providers):

1. Sign up at https://digitalocean.com
2. Click **Create** → **Droplets**
3. Choose:
   - **Region:** Closest to your users
   - **Image:** **Ubuntu 22.04 LTS**
   - **Size:** Basic → $12/month (2 GB RAM, 1 vCPU) — minimum recommended
   - **Authentication:** **SSH Keys** (recommended) or Password
4. Click **Create Droplet**
5. Note your server's **IP address** (e.g., `164.90.xxx.xxx`)

### Step 3: Set Up SSH Key (If Not Done)

```bash
# On your LOCAL computer — generate SSH key
ssh-keygen -t ed25519 -C "nexuslearn-server"

# Press Enter for default location
# Set a passphrase (or leave empty)

# Copy your public key
cat ~/.ssh/id_ed25519.pub

# Paste this key when creating your server (or add it after via provider dashboard)
```

### Step 4: Connect to Your Server

```bash
# Connect via SSH
ssh root@YOUR_SERVER_IP

# Example:
ssh root@164.90.123.45
```

You should see a welcome message from Ubuntu.

---

## PHASE 2: SET UP THE SERVER (30 minutes)

### Step 5: Update System & Install Dependencies

```bash
# Update system packages
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git unzip nginx certbot python3-certbot-nginx

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installations
node --version   # Should show v20.x.x
npm --version    # Should show 10.x.x

# Install PM2 (process manager — keeps your app running)
npm install -g pm2
```

### Step 6: Install PostgreSQL Database

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl enable postgresql
systemctl start postgresql

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE USER nexuslearn WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE nexuslearn_db OWNER nexuslearn;
GRANT ALL PRIVILEGES ON DATABASE nexuslearn_db TO nexuslearn;
\q
EOF
```

> ⚠️ **IMPORTANT:** Replace `your_strong_password_here` with a strong, unique password! Save it somewhere safe.

Your database URL will be:
```
postgresql://nexuslearn:your_strong_password_here@localhost:5432/nexuslearn_db
```

### Step 7: Create a Non-Root User (Security Best Practice)

```bash
# Create a user for running the app
adduser nexuslearn
# Set a password when prompted

# Add to sudo group
usermod -aG sudo nexuslearn

# Switch to the new user
su - nexuslearn
```

---

## PHASE 3: DEPLOY NEXUSLEARN (30 minutes)

### Step 8: Upload Your Code

**Option A: Upload ZIP via SCP (from your local computer)**

```bash
# Run this on YOUR LOCAL computer (not the server)
scp /path/to/nexuslearn-production.zip nexuslearn@YOUR_SERVER_IP:~/
```

Then on the server:
```bash
# On the server
cd ~
unzip nexuslearn-production.zip
cd nexuslearn-production
```

**Option B: Upload via Git (Recommended for ongoing updates)**

```bash
# On the server
cd ~

# If you have a GitHub repo:
git clone https://github.com/YOUR_USERNAME/nexuslearn.git nexuslearn-production
cd nexuslearn-production
```

**Option C: Upload via SFTP (GUI)**

Use an SFTP client like:
- **FileZilla** (free): https://filezilla-project.org
- **WinSCP** (Windows): https://winscp.net
- **Cyberduck** (Mac): https://cyberduck.io

Connect with your server IP, username, and password. Upload the ZIP and extract it.

### Step 9: Install Dependencies

```bash
cd ~/nexuslearn-production

# Install Node.js packages
npm install

# Generate Prisma client
npx prisma generate
```

### Step 10: Configure Environment Variables

```bash
# Create the environment file
nano .env
```

Paste the following (edit each value):

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://nexuslearn:your_strong_password_here@localhost:5432/nexuslearn_db"

# ============================================
# AUTHENTICATION
# ============================================
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="GENERATE_WITH_openssl_rand_-base64_32"

# Google OAuth (optional — get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# GitHub OAuth (optional — get from https://github.com/settings/developers)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# ============================================
# VIDEO CONFERENCING (LiveKit)
# ============================================
# Get from https://cloud.livekit.io (free tier: 50 participants/month)
LIVEKIT_API_KEY=""
LIVEKIT_API_SECRET=""
LIVEKIT_URL=""

# ============================================
# FILE STORAGE
# ============================================
# Option A: Uploadthing (https://uploadthing.com — free 2GB)
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# Option B: AWS S3
S3_BUCKET=""
S3_REGION=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""

# ============================================
# EMAIL (SMTP)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
EMAIL_FROM="noreply@yourdomain.com"

# ============================================
# PAYMENTS (Stripe)
# ============================================
# Get from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# ============================================
# AI FEATURES (Optional)
# ============================================
OPENAI_API_KEY=""
ELEVENLABS_API_KEY=""

# ============================================
# APP SETTINGS
# ============================================
NODE_ENV="production"
PORT="3000"
```

Save and exit: **Ctrl+X** → **Y** → **Enter**

Generate the NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
# Copy the output and paste it as NEXTAUTH_SECRET in .env
```

### Step 11: Initialize the Database

```bash
cd ~/nexuslearn-production

# Push schema to database (creates all 86 tables)
npx prisma db push

# (Optional) Seed with sample data
npx prisma db seed

# Verify tables were created
npx prisma studio
# Opens a browser-based DB viewer at http://localhost:5555
# Press Ctrl+C to close when done
```

### Step 12: Build the Production App

```bash
cd ~/nexuslearn-production

# Build the Next.js app for production
npm run build

# This may take 2-5 minutes. You should see:
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages
```

### Step 13: Test the App

```bash
# Start the app
npm run start

# It should say: ▲ Next.js 14.x
#                ✓ Ready on http://localhost:3000
```

Open a browser and go to `http://YOUR_SERVER_IP:3000` — you should see NexusLearn!

Press **Ctrl+C** to stop (we'll set up PM2 to keep it running permanently in the next step).

---

## PHASE 4: KEEP IT RUNNING 24/7 (15 minutes)

### Step 14: Set Up PM2 Process Manager

PM2 keeps your app running even after you disconnect from SSH, and auto-restarts it if it crashes.

```bash
cd ~/nexuslearn-production

# Start with PM2
pm2 start npm --name "nexuslearn" -- start

# Verify it's running
pm2 status

# You should see:
# ┌──────────┬────┬──────┬──────┬────────┬─────────┬────────┐
# │ App name │ id │ mode │ pid  │ status │ restart │ uptime │
# │ nexuslearn│ 0 │ fork │ 1234 │ online │ 0       │ 0s     │
# └──────────┴────┴──────┴──────┴────────┴─────────┴────────┘

# Save the process list (survives server reboots)
pm2 save

# Set PM2 to start on server boot
pm2 startup
# Follow the command it prints (copy-paste the sudo command)
```

### PM2 Useful Commands

```bash
pm2 status                 # Check if app is running
pm2 logs nexuslearn        # View app logs (real-time)
pm2 logs nexuslearn --lines 100  # View last 100 log lines
pm2 restart nexuslearn     # Restart the app
pm2 stop nexuslearn        # Stop the app
pm2 delete nexuslearn      # Remove from PM2
pm2 monit                  # Real-time monitoring dashboard
```

---

## PHASE 5: SET UP DOMAIN & HTTPS (30 minutes)

### Step 15: Buy a Domain Name

Buy from any registrar:
- **Namecheap:** https://namecheap.com (~$9/year for .com)
- **Cloudflare:** https://dash.cloudflare.com/domains (~$9/year, cheapest)
- **Google Domains → Squarespace:** https://domains.squarespace.com
- **GoDaddy:** https://godaddy.com

### Step 16: Point Domain to Your Server

In your domain registrar's DNS settings, add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | `YOUR_SERVER_IP` | 3600 |
| **A** | `www` | `YOUR_SERVER_IP` | 3600 |

Example for `nexuslearn.com`:
- `nexuslearn.com` → `164.90.123.45`
- `www.nexuslearn.com` → `164.90.123.45`

> ⏳ DNS can take up to 48 hours to propagate, but usually takes 5–30 minutes.

Verify DNS is working:
```bash
# Check from your local machine or the server
ping nexuslearn.com
# Should show your server IP
```

### Step 17: Configure Nginx (Reverse Proxy)

Nginx sits in front of your app, handles HTTPS, and forwards requests to Next.js.

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/nexuslearn
```

Paste this (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (will work after Step 18)
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be added by Certbot in Step 18)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Max upload size (for file uploads)
    client_max_body_size 100M;

    # Proxy to Next.js app
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

        # Timeout settings for long-running requests (video uploads, etc.)
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # WebSocket support (for real-time chat, video signaling)
    location /_next/webpack-hmr {
        proxy_pass http://localhost:3000/_next/webpack-hmr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60d;
        add_header Cache-Control "public, max-age=5184000, immutable";
    }

    # Cache public files
    location /icons {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

Save and exit: **Ctrl+X** → **Y** → **Enter**

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/nexuslearn /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t
# Should say: syntax is ok / test is successful

# Restart nginx
sudo systemctl restart nginx
```

### Step 18: Get Free SSL Certificate (HTTPS)

```bash
# Get SSL certificate from Let's Encrypt (FREE, auto-renews)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# When prompted:
# - Enter your email
# - Agree to terms (Y)
# - Share email with EFF (your choice)
# - Certbot will automatically configure Nginx for HTTPS

# Verify auto-renewal works
sudo certbot renew --dry-run

# Set up automatic renewal (runs twice daily)
sudo crontab -e
# Add this line:
0 0,12 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### Step 19: Update Environment Variable

```bash
cd ~/nexuslearn-production
nano .env

# Change NEXTAUTH_URL to your domain:
NEXTAUTH_URL="https://yourdomain.com"

# Save and restart
pm2 restart nexuslearn
```

### Step 20: Verify Everything Works

Open your browser and go to `https://yourdomain.com`

✅ Checklist:
```
□ Page loads with HTTPS (🔒 padlock in address bar)
□ Registration works
□ Login works
□ Dashboard loads
□ Can create a meeting
□ Can create a course
□ Video/audio works (if LiveKit configured)
□ File upload works (if storage configured)
□ PWA install prompt appears
```

---

## PHASE 6: SECURITY HARDENING (20 minutes)

### Step 21: Set Up Firewall

```bash
# Enable Ubuntu's firewall
sudo ufw allow OpenSSH        # SSH (port 22) — DON'T SKIP THIS!
sudo ufw allow 'Nginx Full'   # HTTP + HTTPS (ports 80, 443)
sudo ufw enable                # Activate firewall

# Verify
sudo ufw status
# Should show SSH, Nginx Full allowed — everything else blocked
```

### Step 22: Secure SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Change these settings:
```
# Disable root login (use your nexuslearn user instead)
PermitRootLogin no

# Disable password auth (use SSH keys only)
PasswordAuthentication no

# Change default SSH port (optional but recommended)
Port 2222
```

```bash
# If you changed SSH port, allow it through firewall
sudo ufw allow 2222/tcp

# Restart SSH
sudo systemctl restart sshd
```

> ⚠️ **Before logging out**, open a NEW terminal and test you can still connect:
> ```bash
> ssh -p 2222 nexuslearn@YOUR_SERVER_IP
> ```

### Step 23: Enable Automatic Security Updates

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
# Select "Yes" to enable automatic updates
```

### Step 24: Set Up Fail2Ban (Block Brute Force)

```bash
sudo apt install fail2ban

sudo nano /etc/fail2ban/jail.local
```

Paste:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## PHASE 7: BACKUPS (15 minutes)

### Step 25: Set Up Database Backups

```bash
# Create backup directory
mkdir -p ~/backups

# Create backup script
nano ~/backup-nexuslearn.sh
```

Paste:
```bash
#!/bin/bash
# NexusLearn Database Backup Script

BACKUP_DIR=~/backups
DATE=$(date +%Y-%m-%d_%H-%M-%S)
DB_NAME="nexuslearn_db"
DB_USER="nexuslearn"

# Dump database
PGPASSWORD="your_strong_password_here" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > "$BACKUP_DIR/nexuslearn_$DATE.sql.gz"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "nexuslearn_*.sql.gz" -mtime +30 -delete

echo "Backup completed: nexuslearn_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x ~/backup-nexuslearn.sh

# Test it
./backup-nexuslearn.sh

# Set up daily automatic backup (runs at 3 AM)
crontab -e
# Add:
0 3 * * * /home/nexuslearn/backup-nexuslearn.sh >> /home/nexuslearn/backups/backup.log 2>&1
```

### Step 26: Restore from Backup (When Needed)

```bash
# List backups
ls -la ~/backups/

# Restore a backup
gunzip -c ~/backups/nexuslearn_2025-01-15_03-00-00.sql.gz | PGPASSWORD="your_password" psql -U nexuslearn -h localhost nexuslearn_db
```

---

## PHASE 8: UPDATES & MAINTENANCE

### Step 27: How to Update NexusLearn

When you have a new version of the code:

```bash
# Connect to your server
ssh nexuslearn@YOUR_SERVER_IP

# Navigate to project
cd ~/nexuslearn-production

# Option A: If using Git
git pull origin main

# Option B: If uploading ZIP
# Upload new ZIP via SCP/SFTP, then:
# unzip -o nexuslearn-production.zip

# Install any new dependencies
npm install

# Run database migrations (if schema changed)
npx prisma db push

# Rebuild the app
npm run build

# Restart
pm2 restart nexuslearn

# Verify it's running
pm2 status
```

### Step 28: Monitor Your Server

```bash
# Check app status
pm2 status

# View live logs
pm2 logs nexuslearn

# Check server resources
htop

# Check disk space
df -h

# Check memory usage
free -m

# Check nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📊 Quick Reference — All Commands

```bash
# ─── APP MANAGEMENT ───
pm2 status                    # Is the app running?
pm2 restart nexuslearn        # Restart app
pm2 logs nexuslearn           # View logs
pm2 monit                     # Real-time dashboard

# ─── NGINX ───
sudo nginx -t                 # Test config
sudo systemctl restart nginx  # Restart nginx
sudo tail -f /var/log/nginx/error.log  # View errors

# ─── DATABASE ───
sudo -u postgres psql         # Access PostgreSQL
npx prisma studio             # Visual DB browser
./backup-nexuslearn.sh        # Manual backup

# ─── SERVER ───
htop                          # CPU/Memory monitor
df -h                         # Disk space
sudo ufw status               # Firewall status
sudo fail2ban-client status   # Security status

# ─── SSL ───
sudo certbot renew            # Renew SSL cert
sudo certbot certificates     # Check cert expiry

# ─── UPDATES ───
git pull && npm install && npm run build && pm2 restart nexuslearn
```

---

## 💰 Total Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| **VPS Server (2GB)** | $6–$12 | Monthly |
| **Domain Name** | $9–$15 | Yearly |
| **SSL Certificate** | FREE | Auto-renews |
| **PostgreSQL** | FREE | Included on server |
| **Let's Encrypt** | FREE | — |
| **PM2** | FREE | Open source |
| **Nginx** | FREE | Open source |
| **Year 1 Total** | **~$85–$160** | — |

> 💡 Compare: Vercel Pro is $20/month ($240/year) + separate DB hosting. Self-hosting saves money at scale!

---

## 🆘 Troubleshooting

### App won't start
```bash
pm2 logs nexuslearn --lines 50    # Check error logs
cat .env                           # Verify env variables
npx prisma db push                 # Re-sync database schema
npm run build                      # Rebuild
pm2 restart nexuslearn
```

### Can't connect to site
```bash
sudo ufw status                   # Firewall blocking?
sudo systemctl status nginx       # Nginx running?
pm2 status                        # App running?
sudo nginx -t                     # Config error?
```

### Database connection error
```bash
sudo systemctl status postgresql  # DB running?
sudo -u postgres psql -l          # List databases
# Check DATABASE_URL in .env matches your setup
```

### SSL certificate not working
```bash
sudo certbot certificates         # Check status
sudo certbot renew --force-renewal # Force renewal
sudo systemctl restart nginx
```

### Out of memory
```bash
free -m                           # Check available memory
# Consider upgrading VPS to 4 GB RAM
# Or add swap space:
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
```

---

## ✅ Final Checklist

```
PHASE 1: SERVER
  □ VPS created (Ubuntu 22.04)
  □ SSH access working

PHASE 2: SETUP
  □ Node.js 20 installed
  □ PostgreSQL installed & database created
  □ PM2 installed
  □ Nginx installed

PHASE 3: DEPLOY
  □ NexusLearn code uploaded
  □ npm install completed
  □ .env configured with all variables
  □ Database tables created (prisma db push)
  □ App built (npm run build)
  □ App starts successfully

PHASE 4: RUNNING
  □ PM2 keeping app alive
  □ PM2 set to start on boot

PHASE 5: DOMAIN & HTTPS
  □ Domain purchased
  □ DNS pointing to server
  □ Nginx configured as reverse proxy
  □ SSL certificate installed (HTTPS working)
  □ NEXTAUTH_URL updated

PHASE 6: SECURITY
  □ Firewall enabled (UFW)
  □ SSH hardened
  □ Fail2Ban running
  □ Auto security updates enabled

PHASE 7: BACKUPS
  □ Backup script created
  □ Daily automatic backups scheduled
  □ Test restore verified

PHASE 8: LIVE!
  □ All features tested via QA checklist
  □ OAuth providers configured
  □ Email working
  □ First admin account created
  □ 🎉 NexusLearn is LIVE!
```

---

> 🎉 **Congratulations!** NexusLearn is now running on YOUR server, under YOUR domain, with YOUR data. Full ownership, full control!
