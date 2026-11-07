#!/usr/bin/env bash
set -e

# ==============================================================================
# Ganraj Logistics Service - AWS 1-Click Deployment Script
# Supports: Ubuntu 22.04 / 24.04 LTS & Amazon Linux 2023
# ==============================================================================

echo "========================================================"
echo "  🚀 Deploying Ganraj Logistics Service to AWS EC2"
echo "========================================================"

# 1. Detect OS & Install Docker if missing
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$ID" == "ubuntu" || "$ID" == "debian" ]]; then
            sudo apt-get update -y
            sudo apt-get install -y ca-certificates curl gnupg lsb-release
            sudo mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$ID/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$ID $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update -y
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        elif [[ "$ID" == "amzn" ]]; then
            sudo dnf update -y
            sudo dnf install -y docker
            sudo systemctl enable --now docker
            # Install docker compose plugin
            sudo mkdir -p /usr/local/lib/docker/cli-plugins
            sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o /usr/local/lib/docker/cli-plugins/docker-compose
            sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
        fi
    fi
    sudo systemctl enable --now docker
    sudo usermod -aG docker $USER || true
    echo "✅ Docker installed successfully."
else
    echo "✅ Docker already installed."
fi

# 2. Check for backend .env
if [ ! -f "backend/backend/.env" ]; then
    echo "⚠️  backend/backend/.env not found! Creating from .env.example..."
    cp backend/backend/.env.example backend/backend/.env
    echo "❗ Please edit backend/backend/.env with your Google App Password and secrets before production use."
fi

# 3. Pull latest code (if git repo)
if [ -d ".git" ]; then
    echo "📥 Pulling latest git updates..."
    git pull origin main || true
fi

# Determine docker command (with sudo fallback if group not reloaded in current session)
if docker info &> /dev/null; then
    DOCKER_CMD="docker"
else
    DOCKER_CMD="sudo docker"
fi

# 4. Build and start containers
echo "🔨 Building and launching containers via Docker Compose..."
$DOCKER_CMD compose pull || true
$DOCKER_CMD compose up -d --build

# 5. Check health
echo "⏳ Waiting for services to come online..."
sleep 8

echo ""
echo "========================================================"
echo "  🎉 GANRAJ LOGISTICS SERVICE IS LIVE ON AWS!"
echo "========================================================"
$DOCKER_CMD compose ps
echo ""
echo "Access your application:"
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || curl -s ifconfig.me 2>/dev/null || echo "YOUR-SERVER-IP")
echo "🌐 Website:   http://${PUBLIC_IP}"
echo "📡 Admin:     http://${PUBLIC_IP}/admin"
echo "🚛 Driver:    http://${PUBLIC_IP}/driver"
echo "📋 API Docs:  http://${PUBLIC_IP}/docs"
echo ""
echo "💡 To bind your domain (e.g. ganrajlogistics.in) with free automatic SSL (HTTPS):"
echo "   Edit 'Caddyfile', replace ':80' with 'yourdomain.com', and run 'docker compose restart proxy'."
echo "========================================================"

