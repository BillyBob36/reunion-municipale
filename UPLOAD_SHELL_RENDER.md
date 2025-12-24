# Upload des fichiers restants via Shell Render

## ✅ Déjà uploadé automatiquement
- residents.json (61 résidents) ✓
- participant_stats.json ✓

## ⏳ À uploader manuellement via Shell Render

Allez sur https://dashboard.render.com → menil-app-backend → **Shell**

### 1. Upload votes.json (20 votes)

Copiez le contenu du fichier `data_backup/votes.json` puis exécutez dans le Shell:

```bash
cat > /app/data/votes.json << 'ENDOFFILE'
[COLLEZ ICI LE CONTENU DE data_backup/votes.json]
ENDOFFILE
```

### 2. Upload reports.json

Copiez le contenu du fichier `data_backup/reports.json` puis exécutez:

```bash
cat > /app/data/reports.json << 'ENDOFFILE'
[COLLEZ ICI LE CONTENU DE data_backup/reports.json]
ENDOFFILE
```

### 3. Upload past_meetings.json

Copiez le contenu du fichier `data_backup/past_meetings.json` puis exécutez:

```bash
cat > /app/data/past_meetings.json << 'ENDOFFILE'
[COLLEZ ICI LE CONTENU DE data_backup/past_meetings.json]
ENDOFFILE
```

### 4. Upload meetings.json

Copiez le contenu du fichier `data_backup/meetings.json` puis exécutez:

```bash
cat > /app/data/meetings.json << 'ENDOFFILE'
[COLLEZ ICI LE CONTENU DE data_backup/meetings.json]
ENDOFFILE
```

## Vérification

Une fois uploadé, exécutez dans le Shell:

```bash
ls -lh /app/data/
cat /app/data/votes.json | head -20
```

Vous devriez voir tous les fichiers avec leurs tailles.
