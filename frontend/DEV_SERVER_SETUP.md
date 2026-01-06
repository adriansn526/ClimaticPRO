# Server de Dezvoltare Persistent - dev.climaticpro.ro

## ✅ Configurare Completă

### 🌐 URL-uri
- **Development:** https://dev.climaticpro.ro
- **Local:** http://localhost:3000
- **Network:** http://10.1.1.8:3000

### 📦 Stack Tehnologic
- **Process Manager:** PM2
- **Reverse Proxy:** Traefik
- **SSL:** Let's Encrypt (Cloudflare DNS Challenge)
- **Framework:** Next.js 15.5.6 + Turbopack

---

## 🚀 Comenzi PM2

### Status și Monitorizare
```bash
# Verificare status
pm2 status

# Monitorizare în timp real
pm2 monit

# Vizualizare loguri live
pm2 logs climaticpro-dev

# Loguri ultimele 50 linii
pm2 logs climaticpro-dev --lines 50

# Loguri doar erori
pm2 logs climaticpro-dev --err
```

### Control Aplicație
```bash
# Pornire
pm2 start ecosystem.config.js

# Oprire
pm2 stop climaticpro-dev

# Restart
pm2 restart climaticpro-dev

# Reload (zero-downtime)
pm2 reload climaticpro-dev

# Ștergere din PM2
pm2 delete climaticpro-dev
```

### Salvare și Auto-Start
```bash
# Salvare configurație curentă
pm2 save

# Configurare auto-start la reboot
pm2 startup

# Dezactivare auto-start
pm2 unstartup
```

### Informații Detaliate
```bash
# Informații complete despre aplicație
pm2 show climaticpro-dev

# Metrici de performanță
pm2 describe climaticpro-dev

# Lista tuturor proceselor
pm2 list
```

---

## 📁 Fișiere de Configurare

### 1. ecosystem.config.js
```javascript
module.exports = {
  apps: [
    {
      name: 'climaticpro-dev',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/asns/projects/climaticpro/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      error_file: '/home/asns/projects/climaticpro/frontend/logs/pm2-error.log',
      out_file: '/home/asns/projects/climaticpro/frontend/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    }
  ]
};
```

### 2. Traefik Dynamic Config
**Locație:** `/home/asns/traefik/dynamic/climaticpro-dev.yml`

```yaml
http:
  routers:
    climaticpro-dev-http:
      rule: "Host(`dev.climaticpro.ro`)"
      entryPoints:
        - web
      middlewares:
        - redirect-to-https
      service: climaticpro-dev

    climaticpro-dev:
      rule: "Host(`dev.climaticpro.ro`)"
      entryPoints:
        - websecure
      tls:
        certResolver: cfresolver
      service: climaticpro-dev

  services:
    climaticpro-dev:
      loadBalancer:
        servers:
          - url: "http://localhost:3000"

  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
```

---

## 🔧 Troubleshooting

### Server nu pornește
```bash
# Verificare erori în loguri
pm2 logs climaticpro-dev --err --lines 100

# Verificare port ocupat
lsof -i :3000

# Restart forțat
pm2 delete climaticpro-dev
pm2 start ecosystem.config.js
```

### SSL nu funcționează
```bash
# Verificare configurație Traefik
docker exec traefik cat /etc/traefik/dynamic/climaticpro-dev.yml

# Restart Traefik
docker restart traefik

# Verificare certificat
curl -I https://dev.climaticpro.ro
```

### Modificări nu apar
```bash
# Next.js cache cleanup
rm -rf .next
pm2 restart climaticpro-dev

# Verificare hot reload
pm2 logs climaticpro-dev | grep "compiled"
```

### Memorie prea mare
```bash
# Verificare utilizare memorie
pm2 monit

# Restart dacă depășește 1GB (automat configurat)
# Sau manual:
pm2 restart climaticpro-dev
```

---

## 📊 Monitorizare

### Loguri
- **Output:** `/home/asns/projects/climaticpro/frontend/logs/pm2-out.log`
- **Erori:** `/home/asns/projects/climaticpro/frontend/logs/pm2-error.log`

### Metrici
```bash
# CPU și Memorie în timp real
pm2 monit

# Statistici detaliate
pm2 show climaticpro-dev
```

---

## 🔄 Workflow Dezvoltare

### 1. Modificări în cod
```bash
# Codul se reîncarcă automat (Turbopack hot reload)
# Nu este nevoie de restart manual
```

### 2. Modificări în dependențe
```bash
cd /home/asns/projects/climaticpro/frontend
npm install
pm2 restart climaticpro-dev
```

### 3. Modificări în .env
```bash
# Editează .env.local
pm2 restart climaticpro-dev
```

### 4. Deploy modificări
```bash
# Pull latest changes
cd /home/asns/projects/climaticpro/frontend
git pull

# Install dependencies (dacă e cazul)
npm install

# Restart server
pm2 restart climaticpro-dev
```

---

## 🔐 Securitate

### Variabile de Mediu
- Configurate în `ecosystem.config.js`
- Sau în `.env.local` (nu commitat în Git)

### SSL/TLS
- Certificat Let's Encrypt automat via Traefik
- Cloudflare DNS Challenge
- Auto-renewal

### Firewall
- Port 3000: Doar localhost (Traefik proxy)
- Port 80/443: Public (Traefik)

---

## 📝 Note Importante

1. **Auto-restart:** PM2 repornește automat aplicația la crash
2. **Auto-start:** PM2 pornește automat la reboot sistem
3. **Hot Reload:** Turbopack reîncarcă automat modificările
4. **Loguri:** Salvate persistent în `/logs/`
5. **SSL:** Automat via Traefik + Let's Encrypt

---

## 🆘 Suport

### Verificare rapidă
```bash
# Status complet
pm2 status && curl -I https://dev.climaticpro.ro

# Loguri ultimele 50 linii
pm2 logs climaticpro-dev --lines 50

# Restart complet
pm2 restart climaticpro-dev && pm2 logs climaticpro-dev
```

### Restart complet sistem
```bash
# Oprire
pm2 stop climaticpro-dev

# Curățare cache
cd /home/asns/projects/climaticpro/frontend
rm -rf .next

# Pornire
pm2 start ecosystem.config.js

# Verificare
pm2 logs climaticpro-dev
```

---

## ✅ Status Actual

- ✅ PM2 configurat și activ
- ✅ Server pornit pe port 3000
- ✅ Traefik reverse proxy configurat
- ✅ SSL/TLS activ (Let's Encrypt)
- ✅ Auto-restart la crash
- ✅ Auto-start la reboot
- ✅ Loguri persistente
- ✅ Hot reload activ (Turbopack)

**URL Live:** https://dev.climaticpro.ro
