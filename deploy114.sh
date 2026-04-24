#!/bin/bash
cd /home/asns/ClimaticPRO/mobile
echo "Starting EAS Build..."
npx eas-cli build -p android --profile preview --local --non-interactive
APK_FILE=$(find . -maxdepth 1 -name "build-*.apk" | sort -n | tail -1)
if [ -n "$APK_FILE" ]; then
    echo "Copying $APK_FILE to v1.1.14..."
    mv "$APK_FILE" /home/asns/ClimaticPRO/frontend/public/downloads/ClimaticPRO-v1.1.14.apk
    cd /home/asns/ClimaticPRO
    ./deploy.sh
fi
