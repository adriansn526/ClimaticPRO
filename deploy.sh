#!/bin/bash

# Deployment script for ClimaticPro
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")"

echo -e "${BLUE}🔨 Building Docker image...${NC}"
cd frontend
docker build \
  --build-arg NEXT_PUBLIC_WORDPRESS_API_URL=https://cms.climaticpro.ro/graphql \
  --build-arg NEXT_PUBLIC_SITE_URL=https://climaticpro.ro \
  -t climaticpro-frontend:latest .

echo -e "${BLUE}🚀 Deploying stack...${NC}"
cd ..
docker compose up -d --build

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "Frontend: https://climaticpro.ro"
echo "CMS: https://cms.climaticpro.ro"

echo -e "\n${BLUE}🧹 Rulăm curățenia automată (Garbage Collection) pentru a preveni blocajele de spațiu...${NC}"
# Șterge imaginile Docker orfane/vechi (dangling) lăsate în urmă de acest build
docker image prune -f
# Curăță build-cache-ul neatașat pentru a preveni umflarea spațiului în timp
docker builder prune -f

echo -e "${GREEN}✅ Sistemul a fost păstrat perfect curat!${NC}"
