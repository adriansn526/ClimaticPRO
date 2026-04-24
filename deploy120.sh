cd /home/asns/ClimaticPRO/mobile
rm -f build-*.apk
eas build --platform android --local --non-interactive --output=./ClimaticPRO-v1.1.20.apk
sudo mv ./ClimaticPRO-v1.1.20.apk ../frontend/public/downloads/
