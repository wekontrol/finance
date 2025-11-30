#!/bin/bash

# Gestor Financeiro Familiar - Complete Autonomous Ubuntu Installation Script
# This script handles full setup including Node.js, PostgreSQL, dependencies, and systemd service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
export DEBIAN_FRONTEND=noninteractive
APP_DIR="/var/www/gestor-financeiro"
APP_USER="nodeapp"
DB_NAME="gestor_financeiro"
DB_USER="gestor_user"
PORT=5000

# Functions
log_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
}

log_step() {
    echo -e "${BLUE}>>> [$1]${NC} $2"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root!"
   exit 1
fi

log_header "Gestor Financeiro Familiar - Ubuntu Installation"

# Step 1: Update system and install base dependencies
log_step "1/10" "Updating system and installing base dependencies..."
apt-get update
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-pip \
    pkg-config \
    libpq-dev \
    supervisor \
    nginx

log_success "Base dependencies installed"

# Step 2: Install Node.js 20.x
log_step "2/10" "Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    log_success "Node.js $(node -v) installed"
else
    log_success "Node.js already installed: $(node -v)"
fi

# Step 3: Install PostgreSQL and admin tools
log_step "3/10" "Installing PostgreSQL and admin tools..."
if ! command -v psql &> /dev/null; then
    apt-get install -y \
        postgresql \
        postgresql-contrib \
        pgadmin4 \
        postgresql-client
    
    log_success "PostgreSQL installed"
    
    # Start PostgreSQL service
    systemctl start postgresql
    systemctl enable postgresql
    log_success "PostgreSQL service enabled and started"
else
    log_success "PostgreSQL already installed"
fi

# Step 4: Create application user and directories
log_step "4/10" "Creating application user and directories..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$APP_USER"
    log_success "User $APP_USER created"
else
    log_success "User $APP_USER already exists"
fi

mkdir -p $APP_DIR
log_success "Application directory created"

# Step 5: Clone/copy application code
log_step "5/10" "Copying application code..."
cp -r . $APP_DIR/
cd $APP_DIR

# Set proper permissions
chown -R $APP_USER:$APP_USER $APP_DIR
chmod -R u+rwX $APP_DIR

log_success "Application code copied"

# Step 6: Setup PostgreSQL database
log_step "6/10" "Setting up PostgreSQL database..."

sudo -u postgres psql <<EOF
-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Create user if not exists
DO \$\$ BEGIN
    CREATE USER $DB_USER WITH ENCRYPTED PASSWORD 'gestor2024!Secure';
EXCEPTION WHEN DUPLICATE_OBJECT THEN
    NULL;
END \$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the database and grant schema privileges
\c $DB_NAME
GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
GRANT USAGE ON SCHEMA public TO $DB_USER;
EOF

log_success "PostgreSQL database '$DB_NAME' created and user '$DB_USER' configured"

# Step 7: Install Node.js dependencies
log_step "7/10" "Installing Node.js dependencies..."
sudo -u $APP_USER sh -c 'cd $APP_DIR && rm -rf node_modules dist package-lock.json 2>/dev/null || true'
sudo -u $APP_USER npm install
log_success "npm dependencies installed"

# Step 8: Build application
log_step "8/10" "Building application..."
sudo -u $APP_USER npm run build
log_success "Application built successfully"

# Step 9: Create .env file
log_step "9/10" "Creating environment configuration..."

# Prompt for external PostgreSQL URL if needed
read -p "Do you have an external PostgreSQL URL? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter PostgreSQL connection URL (TheFinance): " EXTERNAL_POSTGRES_URL
    POSTGRES_URL="$EXTERNAL_POSTGRES_URL"
else
    # Use local PostgreSQL
    POSTGRES_URL="postgresql://$DB_USER:gestor2024!Secure@localhost:5432/$DB_NAME"
    log_warning "Using local PostgreSQL: $POSTGRES_URL"
fi

cat > $APP_DIR/.env.production <<EOF
# Application Configuration
NODE_ENV=production
PORT=$PORT
HOST=0.0.0.0

# Database
TheFinance=$POSTGRES_URL

# Session Secret (change this to a secure random value)
SESSION_SECRET=$(openssl rand -base64 32)

# AI Providers (optional - users can configure in app)
# OPENAI_API_KEY=
# GROQ_API_KEY=
# OPENROUTER_API_KEY=

# Application Name
APP_NAME=Gestor Financeiro Familiar
APP_VERSION=1.0.3

# Features
ENABLE_FAMILY_MODE=true
ENABLE_AI_FEATURES=true
EOF

chmod 600 $APP_DIR/.env.production
chown $APP_USER:$APP_USER $APP_DIR/.env.production
log_success ".env.production created"

# Step 10: Create and enable systemd service
log_step "10/10" "Creating systemd service..."

cat > /etc/systemd/system/gestor-financeiro.service <<EOF
[Unit]
Description=Gestor Financeiro Familiar - Node.js Application
After=network.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Resource Limits
LimitNOFILE=65535
LimitNPROC=65535

# Environment
Environment="NODE_ENV=production"
Environment="PORT=$PORT"
EnvironmentFile=$APP_DIR/.env.production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gestor-financeiro

log_success "Systemd service created and enabled"

# Start the service
echo ""
log_header "Starting Application"
systemctl start gestor-financeiro

# Wait for service to start
sleep 3

# Check service status
if systemctl is-active --quiet gestor-financeiro; then
    log_success "Service started successfully!"
    
    # Get IP address
    IP_ADDR=$(hostname -I | awk '{print $1}')
    
    echo ""
    log_header "Installation Complete! ✓"
    echo ""
    echo -e "${GREEN}Application Details:${NC}"
    echo "  URL: http://$IP_ADDR:$PORT"
    echo "  App Directory: $APP_DIR"
    echo "  App User: $APP_USER"
    echo "  Database: $DB_NAME"
    echo ""
    echo -e "${GREEN}Default Credentials:${NC}"
    echo "  Username: admin"
    echo "  Password: admin"
    echo ""
    echo -e "${GREEN}Database Admin:${NC}"
    echo "  PostgreSQL User: $DB_USER"
    echo "  pgAdmin4 URL: http://$IP_ADDR/pgadmin4"
    echo ""
    echo -e "${GREEN}Useful Commands:${NC}"
    echo "  View logs:           sudo journalctl -u gestor-financeiro -f"
    echo "  Service status:      sudo systemctl status gestor-financeiro"
    echo "  Restart service:     sudo systemctl restart gestor-financeiro"
    echo "  Stop service:        sudo systemctl stop gestor-financeiro"
    echo "  Start service:       sudo systemctl start gestor-financeiro"
    echo "  Rebuild app:         cd $APP_DIR && sudo -u $APP_USER npm run build"
    echo "  View npm logs:       sudo tail -100 /var/log/npm-debug.log 2>/dev/null || echo 'No errors'"
    echo ""
else
    log_error "Service failed to start!"
    echo ""
    echo "Checking logs..."
    sudo journalctl -u gestor-financeiro -n 50
    exit 1
fi
