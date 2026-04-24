# ClimaticPro

**Created**: 2025-12-20

## 📁 Project Structure

```
climaticpro/
├── frontend/              # Next.js application
├── wordpress/             # WordPress files
├── uploads/               # Media Library
├── docker-compose.yml     # Docker stack definition
├── deploy.sh              # Deployment script
├── .env                   # Environment variables
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Development

```bash
cd frontend
PORT=3001 npm run dev
```

### 3. Deploy Production

```bash
./deploy.sh
```

## 🌐 URLs

- **Frontend**: https://climaticpro.ro
- **CMS**: https://cms.climaticpro.ro
- **GraphQL**: https://cms.climaticpro.ro/graphql

## 🗄️ Database

- **Host**: 172.18.0.1:3306
- **Database**: climaticpro_wp
- **User**: climaticpro_wp
- **Password**: See .env file

## 📦 WordPress Setup

After deploying, run:

```bash
bash /home/asns/scripts/setup-wordpress-climaticpro.sh
```

This will automatically install and activate:
- WPGraphQL
- WPGraphQL for ACF
- Redis Object Cache
- ACF Pro
- Rank Math Pro
- Rank Math API Manager

## 🔧 Useful Commands

```bash
# Deploy
./deploy.sh

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose down

# WP-CLI
docker exec climaticpro-wordpress-1 wp plugin list --allow-root
```

## 📚 Documentation

See `/home/asns/ClimaticPro_PROJECT_SETUP.md` for detailed setup instructions.
