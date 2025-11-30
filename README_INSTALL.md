# Guia de Instalação - Gestor Financeiro Familiar

## Instalação em Ubuntu/Debian (Servidor)

Este guia cobre a instalação em um servidor Linux com Ubuntu 20.04 ou superior.

### Opção 1: Script Automático (Recomendado)

Se o seu servidor tem acesso SSH e você tem `sudo`:

```bash
# No diretório do projeto
chmod +x deploy.sh
sudo ./deploy.sh
```

O script configura tudo automaticamente:
- ✅ Node.js 20
- ✅ Git com configuração correta
- ✅ Pacotes npm
- ✅ Compilação para produção
- ✅ Serviço systemd com restart automático
- ✅ Permissões de arquivo corretas
- ✅ Logs centralizados

**Tempo total**: 5-10 minutos

---

## Opção 2: Instalação Manual Passo a Passo

Se o script automático não funcionar, siga estes passos:

### 1. Preparar Sistema

```bash
# Atualizar pacotes
sudo apt-get update
sudo apt-get upgrade -y

# Instalar dependências
sudo apt-get install -y curl git build-essential
```

### 2. Instalar Node.js 20

```bash
# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt-get install -y nodejs
```

Verificar instalação:
```bash
node -v  # deve mostrar v20.x.x
npm -v   # deve mostrar 10.x.x
```

### 3. Configurar Git

```bash
# Configurar git globalmente para evitar problemas de permissão
git config --global --add safe.directory /var/www/gestor-financeiro
git config --global user.name "Deploy Script"
git config --global user.email "deploy@gestor-financeiro.local"
```

### 4. Clonar e Preparar Aplicação

```bash
# Criar diretório
sudo mkdir -p /var/www/gestor-financeiro
cd /var/www/gestor-financeiro

# Copiar arquivos do projeto
# (Use git clone, scp, ou outro método disponível)
sudo chown -R $USER:$USER /var/www/gestor-financeiro
```

### 5. Criar Usuário para a Aplicação

```bash
# Criar usuário sem shell
sudo useradd -m -s /bin/bash nodeapp

# Ajustar permissões
sudo chown -R nodeapp:nodeapp /var/www/gestor-financeiro
sudo chmod -R 755 /var/www/gestor-financeiro
```

### 6. Instalar Dependências e Compilar

```bash
cd /var/www/gestor-financeiro

# Instalar como usuário nodeapp
sudo -u nodeapp npm install

# Compilar para produção
sudo -u nodeapp npm run build
```

### 7. Configurar Serviço Systemd

Criar arquivo `/etc/systemd/system/gestor-financeiro.service`:

```bash
sudo nano /etc/systemd/system/gestor-financeiro.service
```

Cole o seguinte conteúdo:

```ini
[Unit]
Description=Gestor Financeiro Familiar - Node.js Application
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=nodeapp
WorkingDirectory=/var/www/gestor-financeiro
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

LimitNOFILE=65535
LimitNPROC=65535

Environment="NODE_ENV=production"
Environment="PORT=5000"

[Install]
WantedBy=multi-user.target
```

### 8. Ativar e Iniciar Serviço

```bash
# Recarregar configuração systemd
sudo systemctl daemon-reload

# Ativar na inicialização
sudo systemctl enable gestor-financeiro

# Iniciar serviço
sudo systemctl start gestor-financeiro

# Verificar status
sudo systemctl status gestor-financeiro
```

### 9. Acessar Aplicação

A aplicação estará disponível em:
```
http://<seu-ip-do-servidor>:5000
```

**Credenciais padrão:**
- Usuário: `admin`
- Senha: `admin`

---

## Configuração com Nginx Reverso (Opcional)

Para usar Nginx como reverso proxy (porta 80 ao invés de 5000):

### 1. Instalar Nginx

```bash
sudo apt-get install -y nginx
```

### 2. Criar Configuração

Crie `/etc/nginx/sites-available/gestor-financeiro`:

```bash
sudo nano /etc/nginx/sites-available/gestor-financeiro
```

Cole:

```nginx
server {
    listen 80;
    server_name _;
    
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
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

### 3. Ativar Configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/gestor-financeiro \
           /etc/nginx/sites-enabled/

# Remover default
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

Agora a aplicação estará acessível em:
```
http://<seu-ip-do-servidor>
```

---

## Monitoramento e Manutenção

### Ver Logs em Tempo Real

```bash
sudo journalctl -u gestor-financeiro -f
```

### Ver Últimas 50 Linhas de Log

```bash
sudo journalctl -u gestor-financeiro -n 50
```

### Restart da Aplicação

```bash
sudo systemctl restart gestor-financeiro
```

### Parar Aplicação

```bash
sudo systemctl stop gestor-financeiro
```

### Status do Serviço

```bash
sudo systemctl status gestor-financeiro
```

---

## Solução de Problemas

### Erro: "Port 5000 already in use"

```bash
# Encontrar processo usando porta 5000
sudo lsof -i :5000

# Matar processo (se necessário)
sudo kill -9 <PID>
```

### Erro: "npm error EACCES: permission denied"

```bash
# Ajustar permissões
sudo chown -R nodeapp:nodeapp /var/www/gestor-financeiro
sudo chmod -R 755 /var/www/gestor-financeiro
```

### Erro: "Git detected dubious ownership"

```bash
# Configurar git
git config --global --add safe.directory /var/www/gestor-financeiro
```

### Aplicação não inicia

```bash
# Verificar logs detalhados
sudo journalctl -u gestor-financeiro -n 100

# Testar manualmente (como usuário nodeapp)
sudo -u nodeapp npm start
```

### Database Lock Error (SQLite)

```bash
# Remover arquivos de lock
cd /var/www/gestor-financeiro
rm -f data.db-wal data.db-shm
sudo systemctl restart gestor-financeiro
```

### Limpeza Completa

Se precisar fazer uma instalação limpa:

```bash
# Parar serviço
sudo systemctl stop gestor-financeiro

# Limpar diretório
cd /var/www/gestor-financeiro
rm -rf node_modules dist
rm -f package-lock.json
rm -f data.db data.db-wal data.db-shm

# Reinstalar
sudo -u nodeapp npm install
sudo -u nodeapp npm run build

# Reiniciar
sudo systemctl start gestor-financeiro
```

---

## Credenciais Padrão

Na primeira execução, use:
- **Usuário**: `admin`
- **Senha**: `admin`

⚠️ **Altere a senha no primeiro login em produção!**

---

## Backup dos Dados

A base de dados SQLite está em `/var/www/gestor-financeiro/data.db`

Para fazer backup:

```bash
# Backup simples
sudo cp /var/www/gestor-financeiro/data.db \
        /var/www/gestor-financeiro/data.db.backup

# Ou para outro local com data
sudo cp /var/www/gestor-financeiro/data.db \
        /backup/gestor-financeiro-$(date +%Y%m%d).db
```

---

## Próximas Etapas

1. ✅ Aplicação rodando
2. 🔐 Alterar senha do admin
3. 📱 Adicionar mais usuários/famílias
4. 🔑 Configurar API Key do Google Gemini (nas configurações do app)
5. 📊 Começar a rastrear transações

---

**Dúvidas?** Consulte o arquivo `README.md` principal para mais informações.
