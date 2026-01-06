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
docker build -t climaticpro-frontend:latest .

echo -e "${BLUE}🚀 Deploying stack...${NC}"
cd ..
docker compose up -d

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "Frontend: https://climaticpro.asns.ro"
echo "CMS: https://cms-climaticpro.asns.ro"
