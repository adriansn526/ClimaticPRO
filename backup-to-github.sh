#!/bin/bash
DB_NAME="climaticpro_wp"
DB_USER="climaticpro_wp"
DB_PASSWORD="XWBTMMTF0KWTEp7wVzrY"
DB_HOST="172.18.0.1"
BACKUP_DIR="./backups/encrypted"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/climaticpro_${TIMESTAMP}.sql.gz.enc"
mkdir -p "$BACKUP_DIR"
TEMP_FILE="/tmp/climaticpro_${TIMESTAMP}.sql"
mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$TEMP_FILE" 2>/dev/null
gzip "$TEMP_FILE"
openssl enc -aes-256-cbc -salt -pbkdf2 -in "${TEMP_FILE}.gz" -out "$BACKUP_FILE"
rm -f "${TEMP_FILE}.gz"
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
git add "$BACKUP_FILE"
cat > "${BACKUP_DIR}/BACKUP_INFO.md" << EOFINFO
# Database Backups - ClimaticPRO
## Latest: $(basename "$BACKUP_FILE") (${SIZE})
EOFINFO
git add "${BACKUP_DIR}/BACKUP_INFO.md"
git commit -m "backup: encrypted database backup ${TIMESTAMP}"
ls -t "${BACKUP_DIR}"/climaticpro_*.enc | tail -n +6 | xargs -r rm
echo "✅ Backup created: ${SIZE}"
