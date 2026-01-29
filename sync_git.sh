#!/bin/bash
set -e

# Verifică dacă a fost furnizat un mesaj de commit
if [ -z "$1" ]; then
  echo "❌ Eroare: Te rog furnizează un mesaj pentru commit."
  echo "Utilizare: ./sync_git.sh \"Mesajul tau aici\""
  exit 1
fi

COMMIT_MSG=$1

echo "========================================"
echo "🔄 Începem sincronizarea cu GitHub..."
echo "========================================"

# 1. Export Baza de Date
echo "🗄️  Generăm dump-ul bazei de date (climaticpro_dump.sql)..."
# Folosim metoda validată care face stream la stdout pentru a evita problemele de permisiuni
docker-compose -f docker-compose.dev.yml run --rm wp-cli wp db export - > climaticpro_dump.sql

# Curățăm eventualele warning-uri PHP din fișierul generat
sed -i '/^\[/d' climaticpro_dump.sql
sed -i '/^WARNING:/d' climaticpro_dump.sql

echo "✅ Baza de date a fost exportată cu succes."

# 2. Git Operations
echo "📦 Pregătim fișierele pentru git..."
git add .

echo "💾 Facem commit: '$COMMIT_MSG'..."
git commit -m "$COMMIT_MSG"

echo "🚀 Trimitem modificările pe GitHub..."
git push origin main

echo "========================================"
echo "✅ Sincronizare completă!"
echo "========================================"
