#!/bin/bash

# Cleanup script for ClimaticPro dev environment

echo "Starting cleanup..."

# Prune dangling images
echo "Pruning dangling images..."
docker image prune -f

# Prune builder cache (can grow large)
echo "Pruning builder cache..."
docker builder prune -f

# Remove stopped containers (older than 24h?)
# keeping it simple for now
# docker container prune -f

echo "Cleanup complete."
