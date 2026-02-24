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
  --build-arg NEXT_PUBLIC_SITE_URL=https://dev.climaticpro.ro \
  -t climaticpro-frontend:latest .

echo -e "${BLUE}🚀 Deploying stack...${NC}"
cd ..
docker compose up -d --build

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "Frontend: https://climaticpro.asns.ro"
echo "CMS: https://cms-climaticpro.asns.ro"
