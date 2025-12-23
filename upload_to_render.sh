#!/bin/bash
# Script d'upload des données vers Render (version Linux/Mac)

echo "========================================"
echo "Upload des données vers Render"
echo "========================================"
echo ""

# Vérifier que l'URL Render est définie
read -p "Entrez l'URL de votre service Render (ex: https://menil-app-backend.onrender.com): " RENDER_URL

if [ -z "$RENDER_URL" ]; then
    echo "Erreur: URL Render non définie"
    exit 1
fi

echo ""
echo "URL Render: $RENDER_URL"
echo ""

# Vérifier que les fichiers de backup existent
if [ ! -f "data_backup/residents.json" ]; then
    echo "Erreur: Les fichiers de backup n'existent pas"
    echo "Exécutez d'abord le script de backup Railway"
    exit 1
fi

echo "[1/6] Upload de residents.json..."
curl -X POST "$RENDER_URL/api/residents" \
  -H "Content-Type: application/json" \
  -d @data_backup/residents.json
echo ""
echo "    ✓ residents.json uploadé"
echo ""

echo "[2/6] Upload de meetings.json (si non vide)..."
if [ -s "data_backup/meetings.json" ] && [ "$(cat data_backup/meetings.json)" != "[]" ]; then
    curl -X POST "$RENDER_URL/api/meetings" \
      -H "Content-Type: application/json" \
      -d @data_backup/meetings.json
    echo ""
    echo "    ✓ meetings.json uploadé"
else
    echo "    - meetings.json vide, ignoré"
fi
echo ""

echo "[3/6] Upload de reports.json..."
echo "    ℹ reports.json doit être uploadé manuellement via le Shell Render"
echo ""

echo "[4/6] Upload de participant_stats.json..."
curl -X POST "$RENDER_URL/api/participant-stats" \
  -H "Content-Type: application/json" \
  -d @data_backup/participant_stats.json
echo ""
echo "    ✓ participant_stats.json uploadé"
echo ""

echo "[5/6] Vérification - Test API residents..."
curl "$RENDER_URL/api/residents"
echo ""
echo ""

echo "[6/6] Vérification - Health check..."
curl "$RENDER_URL/health"
echo ""
echo ""

echo "========================================"
echo "Upload terminé !"
echo "========================================"
echo ""
echo "Note: Les votes et reports doivent être uploadés manuellement"
echo "via le Shell Render ou l'interface web."
echo ""
