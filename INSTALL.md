# Gestor Financeiro Familiar - Ubuntu Installation Guide

## Complete Autonomous Installation for Ubuntu

This script provides a **full, production-ready installation** on any Ubuntu server with a single command.

### What the Script Installs

✅ **System Dependencies**
- Node.js 20.x
- PostgreSQL (with pgAdmin4 admin interface)
- Build tools, nginx, supervisor
- All required libraries and tools

✅ **Application Setup**
- Clones/copies application code to `/var/www/gestor-financeiro`
- Creates dedicated app user (`nodeapp`)
- Installs all npm dependencies
- Builds application for production

✅ **Database Setup**
- Creates PostgreSQL database (`gestor_financeiro`)
- Creates database user with secure password
- Sets up all required permissions
- Supports external PostgreSQL URLs (Render, Neon, AWS RDS, etc.)

✅ **Service Management**
- Creates systemd service for auto-start
- Handles crashes with automatic restart
- Logs to system journal (journalctl)

✅ **Environment Configuration**
- Generates `.env.production` with secure defaults
- Creates random SESSION_SECRET
- Configurable AI provider keys

---

## Installation Steps

### 1. On Your Ubuntu Server

SSH into your Ubuntu server and run:

```bash
cd /path/to/gestor-financeiro
sudo bash deploy.sh
```

### 2. During Installation

The script will:
- Install everything automatically
- Ask if you have an external PostgreSQL URL (optional)
  - **If YES:** Provide URL from Render, Neon, or your provider
  - **If NO:** Uses local PostgreSQL (automatic)
- Show you the application URL and credentials

### 3. After Installation

The application will be:
- Running at: `http://your-server-ip:5000`
- Managed by systemd
- Auto-restart on crash
- Ready for production

---

## Configuration Details

### Database Options

**Option A: Local PostgreSQL (Default)**
```
PostgreSQL: localhost:5432
Database: gestor_financeiro
User: gestor_user
Password: gestor2024!Secure
```

**Option B: External PostgreSQL (Render, Neon, AWS RDS, etc.)**
When prompted, provide your connection URL:
```
postgresql://user:password@host:5432/database
```

### Environment Variables

After installation, edit `/var/www/gestor-financeiro/.env.production` to add:
- AI Provider API keys (OpenAI, Groq, OpenRouter)
- Custom SESSION_SECRET
- Custom PORT if needed

```bash
sudo nano /var/www/gestor-financeiro/.env.production
```

Then restart:
```bash
sudo systemctl restart gestor-financeiro
```

---

## Post-Installation Commands

### View Application Logs (Real-time)
```bash
sudo journalctl -u gestor-financeiro -f
```

### Check Service Status
```bash
sudo systemctl status gestor-financeiro
```

### Restart Application
```bash
sudo systemctl restart gestor-financeiro
```

### Stop Application
```bash
sudo systemctl stop gestor-financeiro
```

### Start Application
```bash
sudo systemctl start gestor-financeiro
```

### Update Application Code

```bash
cd /var/www/gestor-financeiro
sudo git pull origin main              # or git fetch from your source
sudo -u nodeapp npm install
sudo -u nodeapp npm run build
sudo systemctl restart gestor-financeiro
```

---

## Default Credentials

```
Username: admin
Password: admin
```

⚠️ **IMPORTANT:** Change these after first login!

---

## Database Management

### Access pgAdmin4
Navigate to: `http://your-server-ip/pgadmin4`

### PostgreSQL Admin User
```
Username: postgres
Password: (set by PostgreSQL during install)
```

### Application Database User
```
Username: gestor_user
Password: gestor2024!Secure (change in .env.production)
Database: gestor_financeiro
```

---

## Troubleshooting

### Service Won't Start
Check logs:
```bash
sudo journalctl -u gestor-financeiro -n 50
```

### Database Connection Error
Verify `.env.production`:
```bash
cat /var/www/gestor-financeiro/.env.production
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
sudo systemctl restart gestor-financeiro
```

### Port 5000 Already in Use
Edit `.env.production` and change PORT, then restart:
```bash
sudo nano /var/www/gestor-financeiro/.env.production
sudo systemctl restart gestor-financeiro
```

### Permission Issues
Fix permissions:
```bash
sudo chown -R nodeapp:nodeapp /var/www/gestor-financeiro
sudo chmod -R u+rwX /var/www/gestor-finanseiro
```

---

## Security Recommendations

1. **Change Default Password** immediately after login
2. **Update SESSION_SECRET** in `.env.production`
3. **Enable Firewall**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   ```
4. **Setup SSL/HTTPS** with Let's Encrypt
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot certonly --nginx -d your-domain.com
   ```
5. **Setup nginx Reverse Proxy** (optional but recommended)
6. **Regular Backups** of PostgreSQL database

---

## System Requirements

- **OS:** Ubuntu 20.04 LTS or newer
- **CPU:** 2+ cores
- **RAM:** 2GB minimum, 4GB recommended
- **Storage:** 5GB minimum
- **Internet:** Required for initial installation

---

## Support

For issues or questions:
1. Check logs: `sudo journalctl -u gestor-financeiro -f`
2. Verify database: `sudo -u postgres psql -l`
3. Test connection: `sudo -u postgres psql -d gestor_financeiro`

---

**Ready to deploy?** Run the script now:
```bash
sudo bash deploy.sh
```
