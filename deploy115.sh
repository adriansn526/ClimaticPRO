#!/bin/bash
echo "🚀 Pornesc recompilarea Frontend-ului (Next.js) în Docker..."
./deploy.sh
echo "🔨 Frontend recompilat! Pornesc generarea binarelor mobile (EAS Build)..."
cd mobile
eas build --platform android --local --non-interactive --output=./ClimaticPRO-v1.1.15.apk
echo "📦 Mutare APK în zona public downloads..."
mv ./ClimaticPRO-v1.1.15.apk ../frontend/public/downloads/
cd ..
echo "🐳 Reîmprospătare Docker (Frontend public directory) pentru propagarea APK-ului..."
docker compose up -d --build frontend
echo "✅ Proces complet versionaj 1.1.15 terminat!"
