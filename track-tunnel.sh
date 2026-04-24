#!/bin/bash
while true; do
  url=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*exp.direct' | head -n 1)
  if [ ! -z "$url" ]; then
    echo "$url" > /home/asns/ClimaticPRO/data/documents/tunnel.txt
  fi
  sleep 10
done
