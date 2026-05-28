# NexusLearn — Deploy on Your Own Server / Computer

> **Turn any Windows PC, Mac, or Linux machine into a NexusLearn server**
> Total cost: Domain name (~$10/year) + electricity. That's it.

---

## Prerequisites

| What | Minimum | Recommended |
|------|---------|-------------|
| **RAM** | 4 GB | 8 GB+ |
| **CPU** | Dual core | Quad core+ |
| **Storage** | 20 GB free | 50 GB+ SSD |
| **Internet** | 10 Mbps upload | 50 Mbps+ upload |
| **OS** | Windows 10/11, macOS, Ubuntu/Debian | Ubuntu 22.04 LTS |
| **Users** | Up to ~50 concurrent | Up to ~200+ concurrent |

---

## CHOOSE YOUR OS

- **[Option A: Windows PC](#option-a-windows-pc)** — Use your existing Windows computer
- **[Option B: Mac](#option-b-mac)** — Use your Mac
- **[Option C: Linux (Recommended)](#option-c-linux-recommended)** — Best performance & stability

---

## Option A: Windows PC

### Step 1: Install Required Software

**1a. Install Node.js**
```
1. Go to https://nodejs.org
2. Download "LTS" version (v20+)
3. Run installer → Next → Next → Finish
4. Open Command Prompt (Win+R, type "cmd")
5. Verify:
   node --version    (should show v20.x.x)
   npm --version     (should show 10.x.x)
```

**1b. Install PostgreSQL**
```
1. Go to https://www.postgresql.org/download/windows/
2. Download installer
3. Run installer:
   - Choose install directory → Next
   - Select all components → Next
   - Data directory → Next
   - SET A PASSWORD (remember this!) → Next
   - Port: 5432 (default) → Next
   - Finish
4. Open "SQL Shell (psql)" from Start Menu
5. Press Enter for defaults, enter your password
6. Create database:
   CREATE DATABASE nexuslearn;
   \q
```

**1c. Install Git**
```
1. Go to https://git-scm.com/download/win
2. Download and install (all defaults are fine)
```

### Step 2: Download & Setup NexusLearn

Open **Command Prompt** or **PowerShell**:
```powershell
# Navigate to where you want the project
cd C:\Users\YourName\Documents

# Create project folder
mkdir NexusLearn
cd NexusLearn

# Extract the nexuslearn-production.zip here
# (Right-click ZIP → Extract All → choose this folder)

# Install dependencies
npm install
```

### Step 3: Configure Environment

```powershell
# Copy the example env file
copy .env.example .env

# Open in Notepad
notepad .env
```

**Edit `.env` with these values:**
```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/nexuslearn"

# ============================================
# APP URL (your local IP — find it in Step 5)
# ============================================
NEXTAUTH_URL="http://YOUR_LOCAL_IP:3000"
NEXT_PUBLIC_APP_URL="http://YOUR_LOCAL_IP:3000"

# ============================================
# AUTH SECRET (generate a random string)
# ============================================
# Go to https://generate-secret.vercel.app/32
# Copy the result and paste here:
NEXTAUTH_SECRET="paste-your-generated-secret-here"

# ============================================
# OAUTH (Optional — for Google/GitHub login)
# ============================================
# Google: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# GitHub: https://github.com/settings/developers
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# ============================================
# EMAIL (Optional — for verification emails)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
EMAIL_FROM="NexusLearn <your-email@gmail.com>"

# ============================================
# FILE STORAGE (Optional — for file uploads)
# ============================================
# Option 1: Local storage (default, no config needed)
UPLOAD_DIR="./uploads"

# Option 2: AWS S3
# AWS_ACCESS_KEY_ID=""
# AWS_SECRET_ACCESS_KEY=""
# AWS_S3_BUCKET=""
# AWS_REGION=""

# ============================================
# LIVEKIT (Required for video conferencing)
# ============================================
# Free tier: https://livekit.io
LIVEKIT_API_KEY=""
LIVEKIT_API_SECRET=""
NEXT_PUBLIC_LIVEKIT_URL=""

# ============================================
# AI FEATURES (Optional)
# ============================================
OPENAI_API_KEY=""
```

### Step 4: Initialize Database

```powershell
# Generate Prisma client
npx prisma generate

# Create all database tables
npx prisma db push

# (Optional) Seed with sample data
npx prisma db seed
```

### Step 5: Find Your Local IP Address

```powershell
# Run this command:
ipconfig

# Look for "IPv4 Address" under your active adapter
# It will look like: 192.168.1.100 or 192.168.0.50
# This is YOUR_LOCAL_IP — use it in .env
```

### Step 6: Build & Start

```powershell
# Build the production app
npm run build

# Start the server
npm start

# App is now running at http://YOUR_LOCAL_IP:3000
```

### Step 7: Keep Running 24/7 (Windows)

**Option 1: PM2 (Recommended)**
```powershell
# Install PM2
npm install -g pm2
npm install -g pm2-windows-startup

# Start with PM2
pm2 start npm --name "nexuslearn" -- start

# Auto-start on boot
pm2-startup install
pm2 save
```

**Option 2: Run as Windows Service**
```powershell
# Install node-windows
npm install -g node-windows

# Create service script: install-service.js
```
```javascript
// Save as install-service.js in project folder
var Service = require('node-windows').Service;
var svc = new Service({
  name: 'NexusLearn',
  description: 'NexusLearn WebConference & LMS Platform',
  script: 'node_modules/.bin/next',
  scriptOptions: 'start',
  nodeOptions: [],
  workingDirectory: process.cwd(),
  allowServiceLogon: true
});
svc.on('install', function() {
  svc.start();
  console.log('NexusLearn service installed and started!');
});
svc.install();
```
```powershell
node install-service.js
# NexusLearn now runs as a Windows service — survives reboots!
```

### Step 8: Allow Access from Other Devices on Your Network

```powershell
# Open Windows Firewall:
# 1. Press Win+R → type "wf.msc" → Enter
# 2. Click "Inbound Rules" → "New Rule"
# 3. Select "Port" → Next
# 4. TCP, Specific port: 3000 → Next
# 5. Allow the connection → Next
# 6. Check all (Domain, Private, Public) → Next
# 7. Name: "NexusLearn" → Finish

# OR use command line:
netsh advfirewall firewall add rule name="NexusLearn" dir=in action=allow protocol=TCP localport=3000
```

**Test from another device on same WiFi:**
- Phone/tablet: Open browser → `http://192.168.1.100:3000`
- Another computer: Same URL

---

## Option B: Mac

### Step 1: Install Required Software

Open **Terminal** (Cmd+Space → type "Terminal"):

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@20

# Install PostgreSQL
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb nexuslearn
```

### Step 2: Setup NexusLearn

```bash
# Navigate to your preferred folder
cd ~/Documents

# Unzip the production file
unzip nexuslearn-production.zip -d NexusLearn
cd NexusLearn

# Install dependencies
npm install
```

### Step 3: Configure Environment

```bash
# Copy env file
cp .env.example .env

# Edit with nano (or open in TextEdit)
nano .env
```

**Edit `.env`** — same values as Windows (see Step 3 above), except:
```env
# Mac PostgreSQL typically has no password by default:
DATABASE_URL="postgresql://localhost:5432/nexuslearn"
```

### Step 4: Initialize, Build & Start

```bash
# Setup database
npx prisma generate
npx prisma db push

# Find your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1
# Use the 192.168.x.x address in your .env

# Build & start
npm run build
npm start
```

### Step 5: Keep Running 24/7 (Mac)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "nexuslearn" -- start

# Auto-start on boot
pm2 startup
pm2 save

# Useful commands:
pm2 status          # Check status
pm2 logs nexuslearn # View logs
pm2 restart nexuslearn # Restart
```

### Step 6: Allow Network Access

```bash
# Mac firewall — allow Node.js:
# System Preferences → Security & Privacy → Firewall → Firewall Options
# Add Node.js and allow incoming connections

# Test from phone: http://YOUR_MAC_IP:3000
```

---

## Option C: Linux (Recommended)

### Step 1: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database user and database
sudo -u postgres psql -c "CREATE USER nexuslearn WITH PASSWORD 'your-secure-password';"
sudo -u postgres psql -c "CREATE DATABASE nexuslearn OWNER nexuslearn;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nexuslearn TO nexuslearn;"

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

### Step 2: Setup NexusLearn

```bash
# Create app directory
sudo mkdir -p /var/www/nexuslearn
sudo chown $USER:$USER /var/www/nexuslearn

# Unzip production files
cd /var/www/nexuslearn
unzip ~/nexuslearn-production.zip -d .

# Install dependencies
npm install
```

### Step 3: Configure Environment

```bash
cp .env.example .env
nano .env
```

```env
DATABASE_URL="postgresql://nexuslearn:your-secure-password@localhost:5432/nexuslearn"
NEXTAUTH_URL="http://YOUR_LOCAL_IP:3000"
NEXT_PUBLIC_APP_URL="http://YOUR_LOCAL_IP:3000"
NEXTAUTH_SECRET="generate-a-random-32-char-string"

# ... (same other variables as above)
```

### Step 4: Initialize & Build

```bash
npx prisma generate
npx prisma db push
npm run build
```

### Step 5: Find Your Local IP

```bash
hostname -I
# First IP listed is usually your local IP (e.g., 192.168.1.100)
```

### Step 6: Start with PM2 (24/7)

```bash
# Start the app
pm2 start npm --name "nexuslearn" -- start

# Auto-start on reboot
pm2 startup
# Run the command it outputs (sudo env PATH=...)
pm2 save

# Check status
pm2 status
pm2 logs nexuslearn
```

### Step 7: Setup Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/nexuslearn
```

```nginx
server {
    listen 80;
    server_name YOUR_LOCAL_IP;
    # If you have a domain: server_name app.nexuslearn.com;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/nexuslearn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Now accessible at http://YOUR_LOCAL_IP (port 80, no :3000 needed)
```

### Step 8: Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## MAKING IT ACCESSIBLE FROM THE INTERNET

> **Right now your server only works on your local WiFi network.**
> To make it accessible from anywhere in the world, follow these steps:

### Method 1: Port Forwarding (Free)

```
1. Find your router's admin page:
   - Usually http://192.168.1.1 or http://192.168.0.1
   - Login (check router label for default credentials)

2. Find "Port Forwarding" section (varies by router):
   - TP-Link: Advanced → NAT Forwarding → Port Forwarding
   - Netgear: Advanced → Advanced Setup → Port Forwarding
   - ASUS: WAN → Virtual Server / Port Forwarding

3. Add these rules:
   ┌─────────────┬──────────┬───────────┬──────────────────┐
   │ Service Name │ Port     │ Protocol  │ Internal IP      │
   ├─────────────┼──────────┼───────────┼──────────────────┤
   │ NexusLearn  │ 80       │ TCP       │ 192.168.1.100    │
   │ NexusLearn  │ 443      │ TCP       │ 192.168.1.100    │
   └─────────────┴──────────┴───────────┴──────────────────┘
   (Replace 192.168.1.100 with YOUR server's local IP)

4. Save and apply

5. Find your public IP:
   - Google "what is my IP" → note the address
   - Test: http://YOUR_PUBLIC_IP from your phone (on mobile data, not WiFi)
```

### Method 2: Cloudflare Tunnel (Recommended — Free, No Port Forwarding)

```bash
# Install cloudflared
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update
sudo apt install -y cloudflared

# Login to Cloudflare (free account at cloudflare.com)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create nexuslearn

# Configure tunnel
nano ~/.cloudflared/config.yml
```

```yaml
tunnel: nexuslearn
credentials-file: /home/YOUR_USER/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: app.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

```bash
# Add DNS record
cloudflared tunnel route dns nexuslearn app.yourdomain.com

# Start tunnel
cloudflared tunnel run nexuslearn

# Install as service (runs on boot)
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Done! Your app is live at https://app.yourdomain.com
# Cloudflare provides FREE SSL automatically!
```

### Method 3: Ngrok (Quick Testing — Free Tier)

```bash
# Install ngrok
curl -fsSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Sign up at https://ngrok.com (free) and get auth token
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Expose your app
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok-free.app
# Share this URL — anyone can access your app!

# Note: Free tier URL changes each restart
# Paid plan ($8/mo) gets a fixed subdomain
```

---

## GETTING A DOMAIN NAME

```
1. Buy a domain (~$10/year):
   - Namecheap: https://namecheap.com
   - Cloudflare: https://dash.cloudflare.com (cheapest, no markup)
   - Google Domains: https://domains.google
   - GoDaddy: https://godaddy.com

   Suggestions:
   - nexuslearn.com
   - nexuslearn.app
   - nexuslearn.io
   - yournamelearning.com

2. Point domain to your server:
   
   If using Cloudflare Tunnel: Already done in tunnel setup!
   
   If using Port Forwarding:
   - Go to your domain registrar's DNS settings
   - Add an A record:
     Type: A
     Name: app (or @)
     Value: YOUR_PUBLIC_IP
     TTL: Auto
```

---

## FREE SSL CERTIFICATE (HTTPS)

> **Required for video/audio calls (browsers block camera/mic on HTTP)**

### If Using Cloudflare Tunnel:
SSL is **automatic and free** — nothing to do! ✅

### If Using Port Forwarding + Nginx:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get free SSL certificate
sudo certbot --nginx -d app.yourdomain.com

# Enter your email, agree to terms, done!
# Auto-renews every 90 days

# Update your .env:
NEXTAUTH_URL="https://app.yourdomain.com"
NEXT_PUBLIC_APP_URL="https://app.yourdomain.com"

# Rebuild & restart
npm run build
pm2 restart nexuslearn
```

---

## AUTOMATIC DATABASE BACKUPS

```bash
# Create backup script
mkdir -p ~/backups
nano ~/backup-nexuslearn.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups
KEEP_DAYS=30

# Dump database
pg_dump -U nexuslearn nexuslearn | gzip > "$BACKUP_DIR/nexuslearn_$TIMESTAMP.sql.gz"

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "Backup complete: nexuslearn_$TIMESTAMP.sql.gz"
```

```bash
# Make executable
chmod +x ~/backup-nexuslearn.sh

# Schedule daily backup at 2 AM
crontab -e
# Add this line:
0 2 * * * /home/YOUR_USER/backup-nexuslearn.sh
```

---

## UPDATING NEXUSLEARN

When you have a new version:

```bash
# Navigate to project
cd /var/www/nexuslearn    # Linux
cd ~/Documents/NexusLearn # Mac/Windows

# Backup current version
cp -r . ../nexuslearn-backup-$(date +%Y%m%d)

# Replace files with new version
# (extract new ZIP, overwrite files)

# Preserve your .env file!

# Install any new dependencies
npm install

# Update database (if schema changed)
npx prisma generate
npx prisma db push

# Rebuild
npm run build

# Restart
pm2 restart nexuslearn
```

---

## MONITORING YOUR SERVER

### Check if App is Running
```bash
pm2 status
pm2 logs nexuslearn --lines 50
```

### Check System Resources
```bash
# CPU & Memory
htop

# Disk space
df -h

# Database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('nexuslearn'));"
```

### Simple Uptime Monitor (Free)
```
Sign up at one of these free services:
- https://uptimerobot.com (50 monitors free)
- https://betterstack.com (free tier)
- https://cronitor.io (free tier)

Add your URL — get email/SMS alerts if your server goes down.
```

---

## TROUBLESHOOTING

### "Cannot connect from other devices"
```bash
# Check the app is running
pm2 status

# Check firewall
sudo ufw status

# Check Nginx (Linux)
sudo systemctl status nginx
sudo nginx -t

# Windows: Make sure firewall rule is enabled
```

### "Camera/Mic not working"
```
Video/audio requires HTTPS. Make sure you have:
- SSL certificate installed, OR
- Using Cloudflare Tunnel (auto-SSL), OR
- Using localhost (browsers allow HTTP on localhost only)
```

### "Database connection error"
```bash
# Check PostgreSQL is running
# Linux:
sudo systemctl status postgresql
# Mac:
brew services list
# Windows:
# Check Services → postgresql-x64-16
```

### "App is slow"
```bash
# Check memory usage
free -h

# Check CPU
top

# Increase Node.js memory if needed
pm2 start npm --name "nexuslearn" -- start --node-args="--max-old-space-size=4096"
```

### "Power went out / computer restarted"
```
If PM2 startup is configured correctly, the app auto-restarts.
Check with: pm2 status

If not running: pm2 start npm --name "nexuslearn" -- start
```

---

## QUICK REFERENCE CARD

```
┌──────────────────────────────────────────────────────┐
│              NEXUSLEARN SERVER CHEAT SHEET            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  START:    pm2 start npm --name "nexuslearn" -- start│
│  STOP:     pm2 stop nexuslearn                       │
│  RESTART:  pm2 restart nexuslearn                    │
│  LOGS:     pm2 logs nexuslearn                       │
│  STATUS:   pm2 status                                │
│                                                      │
│  DB SHELL: psql -U nexuslearn nexuslearn             │
│  DB BACKUP: ~/backup-nexuslearn.sh                   │
│                                                      │
│  NGINX:    sudo systemctl restart nginx              │
│  SSL:      sudo certbot renew --dry-run              │
│                                                      │
│  LOCAL URL:   http://192.168.x.x:3000                │
│  PUBLIC URL:  https://app.yourdomain.com             │
│                                                      │
│  PROJECT:  /var/www/nexuslearn (Linux)               │
│            ~/Documents/NexusLearn (Mac/Windows)      │
│  CONFIG:   .env                                      │
│  BACKUPS:  ~/backups/                                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## COST SUMMARY

| Item | Cost |
|------|------|
| **Your computer** | Already own it — $0 |
| **Domain name** | ~$10/year |
| **SSL certificate** | Free (Let's Encrypt / Cloudflare) |
| **PostgreSQL** | Free |
| **Node.js, PM2, Nginx** | Free |
| **Cloudflare Tunnel** | Free |
| **Electricity** | ~$5–15/month |
| **Total Year 1** | **~$70–$190** |
| **Total after Year 1** | **~$70–$190/year** |

> 💡 **Compare:** Zoom Pro costs $159/year PER HOST. Your entire NexusLearn platform costs less than ONE Zoom license!

---

*Guide created for NexusLearn v1.0 — May 2025*
