# 🚀 Complete AWS Deployment Guide — Ganraj Logistics Service

This guide walks you through deploying the complete **Ganraj Logistics Service** platform (Next.js Frontend + FastAPI Backend + SQLite DB + Caddy SSL Proxy) to **Amazon Web Services (AWS)** in about 10 minutes.

---

## 🏗️ Architecture Overview

When deployed with the included Docker Compose configuration:

```
                  ┌──────────────────────────────────────────────┐
                  │                 AWS EC2 / VPS                │
                  │                                              │
Internet ───────► │ Port 80 / 443                                │
(Customer/Admin)  │   │                                          │
                  │   ▼                                          │
                  │ ┌──────────────────────────────────────────┐ │
                  │ │        Caddy Reverse Proxy (HTTPS)       │ │
                  │ └──────────────┬──────────────────┬────────┘ │
                  │                │                  │          │
                  │                │ (/)              │ (/api)   │
                  │                ▼                  ▼          │
                  │ ┌──────────────────────┐ ┌─────────────────┐ │
                  │ │   Next.js Frontend   │ │ FastAPI Backend │ │
                  │ │      (Port 3000)     │ │   (Port 8000)   │ │
                  │ └──────────────────────┘ └────────┬────────┘ │
                  │                                   │          │
                  │                                   ▼          │
                  │                          ┌─────────────────┐ │
                  │                          │ Persistent DB   │ │
                  │                          │ (/app/data)     │ │
                  │                          └─────────────────┘ │
                  └──────────────────────────────────────────────┘
```

---

## 📋 Recommended AWS Option: **AWS EC2 (or AWS Lightsail)**

- **Recommended Instance Type:** `t3.small` (2 vCPU, 2 GB RAM) or `t4g.small` (ARM64).
  *(Lightsail $5-$10/month tier is also a great plug-and-play alternative).*
- **Operating System:** Ubuntu 22.04 LTS or Ubuntu 24.04 LTS (x86_64).
- **Storage:** 20 GB gp3 SSD.

---

## 🛠️ Step-by-Step Deployment Instructions

### Step 1: Launch an AWS EC2 Instance

1. Log into your **[AWS Management Console](https://console.aws.amazon.com/)**.
2. Navigate to **EC2** ➔ Click **Launch Instance**.
3. **Name:** `ganraj-logistics-prod`
4. **Application and OS Images:** Select **Ubuntu** (Ubuntu Server 24.04 LTS or 22.04 LTS).
5. **Instance Type:** Select **`t3.small`** (or `t3.micro` for initial testing).
6. **Key Pair (login):**
   - Choose an existing key pair or click **Create new key pair** (e.g. `ganraj-key.pem`).
   - Download the `.pem` file to your computer.
7. **Network Settings (Firewall / Security Group):**
   Ensure the following checkboxes are **checked**:
   - ✅ **Allow SSH traffic from anywhere** (Port `22`)
   - ✅ **Allow HTTP traffic from the internet** (Port `80`)
   - ✅ **Allow HTTPS traffic from the internet** (Port `443`)
8. **Configure Storage:** Change `8 GiB` to **`20 GiB` gp3**.
9. Click **Launch Instance**.

---

### Step 2: Connect to Your Server

You can connect in two ways:

#### Option A: Direct from Browser (Easiest)
1. In the EC2 Console, select your instance and click **Connect**.
2. Select **EC2 Instance Connect** and click **Connect**.
3. A terminal window will open in your browser.

#### Option B: Via SSH from your terminal
```bash
chmod 400 ganraj-key.pem
ssh -i "ganraj-key.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
```

---

### Step 3: Clone Your GitHub Repository

Inside your EC2 terminal, run:

```bash
git clone https://github.com/sp9284384-cyber/Logistics.git
cd Logistics
```

---

### Step 4: Configure Your Production Environment Variables

Create and configure your backend `.env`:

```bash
nano backend/backend/.env
```

Paste your configuration:

```env
DATABASE_URL=sqlite:////app/data/ganraj.db
SECRET_KEY=ganraj-logistics-secret-key-production-2026-prod-ready
ACCESS_TOKEN_EXPIRE_MINUTES=720
CORS_ORIGINS=*
APP_NAME=Ganraj Logistics Service
ENV=production
RATE_LIMIT_PER_MINUTE=120

# Email SMTP Settings (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ganrajlogisticsservice@gmail.com
SMTP_PASSWORD=xsjangxujoqgupgv
NOTIFY_EMAIL=ganrajlogisticsservice@gmail.com

# WhatsApp / Helpline
DISPATCH_PHONE=8108767159
```

Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit.

---

### Step 5: Run the 1-Click Deployment Script

Make the deployment script executable and run it:

```bash
chmod +x deploy-aws.sh
./deploy-aws.sh
```

The script will automatically:
1. Install Docker & Docker Compose.
2. Build optimized Next.js frontend and FastAPI backend containers.
3. Start the containers and reverse proxy in the background.

---

### Step 6: Verify Your Deployment

Check running containers:
```bash
docker compose ps
```

You should see 3 containers running:
- `ganraj-proxy` (Ports `80`, `443`)
- `ganraj-frontend` (Port `3000`)
- `ganraj-backend` (Port `8000`)

Visit in your browser:
- **Website:** `http://<YOUR-EC2-PUBLIC-IP>`
- **Admin Panel:** `http://<YOUR-EC2-PUBLIC-IP>/admin`
- **Driver Portal:** `http://<YOUR-EC2-PUBLIC-IP>/driver`
- **Backend API Docs:** `http://<YOUR-EC2-PUBLIC-IP>/docs`

---

## 🔒 Step 7: Connect Custom Domain & Enable Free Automatic SSL (HTTPS)

When you are ready to point your domain (e.g. `ganrajlogistics.in`):

1. **In your Domain DNS Provider (GoDaddy / Hostinger / Namecheap / AWS Route 53):**
   - Add an **A Record**:
     - **Host:** `@` (or `www`)
     - **Value / IP:** `<YOUR-EC2-PUBLIC-IP>`
     - **TTL:** 300 seconds

2. **Update `Caddyfile` on the server:**
   ```bash
   nano Caddyfile
   ```
   Change the first line from:
   ```caddy
   :80 {
   ```
   To your domain:
   ```caddy
   ganrajlogistics.in, www.ganrajlogistics.in {
   ```

3. **Restart the proxy container:**
   ```bash
   docker compose restart proxy
   ```

Caddy will automatically provision a **free Let's Encrypt SSL certificate** and automatically renew it forever! Your site will be live at `https://ganrajlogistics.in`.

---

## 🔄 Useful Operations & Maintenance Commands

| Task | Command |
|---|---|
| View real-time logs | `docker compose logs -f` |
| View backend logs | `docker compose logs -f backend` |
| View frontend logs | `docker compose logs -f frontend` |
| Pull updates from GitHub | `git pull origin main && docker compose up -d --build` |
| Restart all services | `docker compose restart` |
| Stop all services | `docker compose down` |
| Backup database | `docker cp ganraj-backend:/app/data/ganraj.db ./ganraj_backup.db` |
