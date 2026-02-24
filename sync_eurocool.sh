#!/bin/bash

# Define the project directory
PROJECT_DIR="/home/asns/ClimaticPRO"

# navigate to directory
cd "$PROJECT_DIR" || exit 1

# Activate virtual environment if it exists, otherwise rely on system python
if [ -d "venv-scrapper" ]; then
    PYTHON_EXEC="./venv-scrapper/bin/python3"
else
    PYTHON_EXEC="python3"
fi

# Create logs directory if not exists
mkdir -p logs

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
echo "Starting Eurocool Sync at $TIMESTAMP" >> logs/sync_history.log

# 1. Run Scraper
echo "Running Scraper..."
$PYTHON_EXEC eurocool_scraper.py > logs/scraper_last.log 2>&1
SCRAPER_STATUS=$?

if [ $SCRAPER_STATUS -eq 0 ]; then
    echo "Scraper finished successfully." >> logs/sync_history.log
    
    # 2. Run Importer
    echo "Running Importer..."
    $PYTHON_EXEC eurocool_importer.py > logs/importer_last.log 2>&1
    IMPORTER_STATUS=$?
    
    if [ $IMPORTER_STATUS -eq 0 ]; then
        echo "Importer finished successfully." >> logs/sync_history.log
    else
        echo "Importer FAILED. Check logs/importer_last.log" >> logs/sync_history.log
    fi
else
    echo "Scraper FAILED. Check logs/scraper_last.log" >> logs/sync_history.log
fi

echo "Sync process ended at $(date)" >> logs/sync_history.log
echo "---------------------------------------------------" >> logs/sync_history.log
