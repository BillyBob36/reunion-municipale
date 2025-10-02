#!/usr/bin/env python3
"""
Serveur backend minimal pour l'application Menil
Gère uniquement la lecture/écriture des fichiers JSON
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime
from pathlib import Path

app = Flask(__name__, static_folder='.')
CORS(app)

# Dossier de stockage des données
DATA_DIR = Path('data')
DATA_DIR.mkdir(exist_ok=True)

# Initialiser les fichiers JSON s'ils n'existent pas
def init_data_files():
    files = {
        'meetings.json': [],
        'votes.json': [],
        'residents.json': [],
        'reports.json': {},
        'participant_stats.json': {}
    }
    
    for filename, default_content in files.items():
        filepath = DATA_DIR / filename
        if not filepath.exists():
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(default_content, f, ensure_ascii=False, indent=2)

init_data_files()

# ===== ROUTES POUR LES RÉUNIONS =====

@app.route('/api/meetings', methods=['GET'])
def get_meetings():
    """Récupérer toutes les réunions"""
    try:
        with open(DATA_DIR / 'meetings.json', 'r', encoding='utf-8') as f:
            meetings = json.load(f)
        return jsonify(meetings)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/meetings', methods=['POST'])
def create_meeting():
    """Créer une nouvelle réunion"""
    try:
        meeting_data = request.json
        meeting_data['createdAt'] = datetime.now().isoformat()
        
        with open(DATA_DIR / 'meetings.json', 'r', encoding='utf-8') as f:
            meetings = json.load(f)
        
        meetings.append(meeting_data)
        
        with open(DATA_DIR / 'meetings.json', 'w', encoding='utf-8') as f:
            json.dump(meetings, f, ensure_ascii=False, indent=2)
        
        return jsonify(meeting_data), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/meetings/<meeting_id>', methods=['DELETE'])
def delete_meeting(meeting_id):
    """Supprimer une réunion"""
    try:
        with open(DATA_DIR / 'meetings.json', 'r', encoding='utf-8') as f:
            meetings = json.load(f)
        
        meetings = [m for m in meetings if m.get('id') != meeting_id]
        
        with open(DATA_DIR / 'meetings.json', 'w', encoding='utf-8') as f:
            json.dump(meetings, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== ROUTES POUR LES VOTES =====

@app.route('/api/votes', methods=['GET'])
def get_votes():
    """Récupérer les votes (avec filtre optionnel par meetingId)"""
    try:
        meeting_id = request.args.get('meetingId')
        
        with open(DATA_DIR / 'votes.json', 'r', encoding='utf-8') as f:
            votes = json.load(f)
        
        if meeting_id:
            votes = [v for v in votes if v.get('meetingId') == meeting_id]
        
        return jsonify(votes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/votes', methods=['POST'])
def create_vote():
    """Créer un nouveau vote"""
    try:
        vote_data = request.json
        
        # Générer un ID unique
        import uuid
        vote_id = str(uuid.uuid4())[:8]
        
        complete_vote = {
            'id': vote_id,
            'title': vote_data.get('title', ''),
            'description': vote_data.get('description', ''),
            'options': vote_data.get('options', []),
            'allowMultiple': vote_data.get('allowMultiple', False),
            'createdBy': vote_data.get('createdBy', ''),
            'meetingId': vote_data.get('meetingId', ''),
            'createdAt': datetime.now().isoformat(),
            'status': 'active',
            'votes': {},
            'voters': []
        }
        
        # Initialiser les compteurs
        for option in complete_vote['options']:
            complete_vote['votes'][option] = 0
        
        with open(DATA_DIR / 'votes.json', 'r', encoding='utf-8') as f:
            votes = json.load(f)
        
        votes.append(complete_vote)
        
        with open(DATA_DIR / 'votes.json', 'w', encoding='utf-8') as f:
            json.dump(votes, f, ensure_ascii=False, indent=2)
        
        return jsonify(complete_vote), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/votes/<vote_id>/submit', methods=['POST'])
def submit_vote(vote_id):
    """Soumettre un vote"""
    try:
        submission_data = request.json
        
        with open(DATA_DIR / 'votes.json', 'r', encoding='utf-8') as f:
            votes = json.load(f)
        
        vote = next((v for v in votes if v.get('id') == vote_id), None)
        if not vote:
            return jsonify({'error': 'Vote introuvable'}), 404
        
        user_name = submission_data.get('userName')
        selected_options = submission_data.get('selectedOptions', [])
        
        # Supprimer le vote précédent de cet utilisateur
        if user_name in vote.get('voters', []):
            for option in vote.get('options', []):
                if option in vote.get('votes', {}):
                    vote['votes'][option] = max(0, vote['votes'][option] - 1)
            vote['voters'].remove(user_name)
        
        # Ajouter le nouveau vote
        vote.setdefault('voters', []).append(user_name)
        for option in selected_options:
            if option in vote.get('options', []):
                vote.setdefault('votes', {})[option] = vote['votes'].get(option, 0) + 1
        
        with open(DATA_DIR / 'votes.json', 'w', encoding='utf-8') as f:
            json.dump(votes, f, ensure_ascii=False, indent=2)
        
        return jsonify(vote)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/votes/<vote_id>/cancel', methods=['POST'])
def cancel_vote(vote_id):
    """Annuler le vote d'un utilisateur"""
    try:
        cancel_data = request.json
        
        with open(DATA_DIR / 'votes.json', 'r', encoding='utf-8') as f:
            votes = json.load(f)
        
        vote = next((v for v in votes if v.get('id') == vote_id), None)
        if not vote:
            return jsonify({'error': 'Vote introuvable'}), 404
        
        if vote.get('status') != 'active':
            return jsonify({'error': 'Ce vote est fermé'}), 400
        
        user_name = cancel_data.get('userName')
        if not user_name or user_name not in vote.get('voters', []):
            return jsonify({'error': 'Vous n\'avez pas encore voté'}), 400
        
        vote['voters'].remove(user_name)
        
        # Décrémenter les compteurs
        for option in vote.get('options', []):
            if vote.get('votes', {}).get(option, 0) > 0:
                vote['votes'][option] -= 1
                break
        
        with open(DATA_DIR / 'votes.json', 'w', encoding='utf-8') as f:
            json.dump(votes, f, ensure_ascii=False, indent=2)
        
        return jsonify(vote)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/votes/<vote_id>', methods=['DELETE'])
def close_vote(vote_id):
    """Fermer un vote"""
    try:
        with open(DATA_DIR / 'votes.json', 'r', encoding='utf-8') as f:
            votes = json.load(f)
        
        vote = next((v for v in votes if v.get('id') == vote_id), None)
        if not vote:
            return jsonify({'error': 'Vote introuvable'}), 404
        
        vote['status'] = 'closed'
        vote['closedAt'] = datetime.now().isoformat()
        
        with open(DATA_DIR / 'votes.json', 'w', encoding='utf-8') as f:
            json.dump(votes, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True, 'vote': vote})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== ROUTES POUR LES ADMINISTRÉS =====

@app.route('/api/residents', methods=['GET'])
def get_residents():
    """Récupérer tous les administrés"""
    try:
        with open(DATA_DIR / 'residents.json', 'r', encoding='utf-8') as f:
            residents = json.load(f)
        return jsonify(residents)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/residents', methods=['POST'])
def save_residents():
    """Sauvegarder les administrés"""
    try:
        residents = request.json
        
        with open(DATA_DIR / 'residents.json', 'w', encoding='utf-8') as f:
            json.dump(residents, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True, 'message': 'Administrés sauvegardés avec succès'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== ROUTES POUR LES COMPTES-RENDUS =====

@app.route('/api/reports/<meeting_id>', methods=['GET'])
def get_report(meeting_id):
    """Récupérer le compte-rendu d'une réunion"""
    try:
        with open(DATA_DIR / 'reports.json', 'r', encoding='utf-8') as f:
            reports = json.load(f)
        
        report = reports.get(meeting_id, {'meetingId': meeting_id, 'reportUrl': ''})
        return jsonify(report)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<meeting_id>', methods=['POST'])
def update_report(meeting_id):
    """Mettre à jour le lien du compte-rendu"""
    try:
        report_data = request.json
        
        with open(DATA_DIR / 'reports.json', 'r', encoding='utf-8') as f:
            reports = json.load(f)
        
        reports[meeting_id] = {
            'meetingId': meeting_id,
            'reportUrl': report_data.get('reportUrl', ''),
            'updatedAt': datetime.now().isoformat()
        }
        
        with open(DATA_DIR / 'reports.json', 'w', encoding='utf-8') as f:
            json.dump(reports, f, ensure_ascii=False, indent=2)
        
        return jsonify(reports[meeting_id])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== ROUTES POUR LES STATISTIQUES PARTICIPANTS =====

@app.route('/api/participant-stats', methods=['GET'])
def get_participant_stats():
    """Récupérer les statistiques des participants"""
    try:
        with open(DATA_DIR / 'participant_stats.json', 'r', encoding='utf-8') as f:
            stats = json.load(f)
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/participant-stats', methods=['POST'])
def save_participant_stats():
    """Sauvegarder les statistiques des participants"""
    try:
        stats = request.json
        
        with open(DATA_DIR / 'participant_stats.json', 'w', encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== ROUTES POUR LES RÉUNIONS PASSÉES =====

@app.route('/api/past-meetings', methods=['GET'])
def get_past_meetings():
    """Récupérer toutes les réunions passées"""
    try:
        filepath = DATA_DIR / 'past_meetings.json'
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                past_meetings = json.load(f)
        else:
            past_meetings = []
        return jsonify(past_meetings)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/past-meetings', methods=['POST'])
def save_past_meeting():
    """Sauvegarder une réunion passée"""
    try:
        meeting_data = request.json
        
        filepath = DATA_DIR / 'past_meetings.json'
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                past_meetings = json.load(f)
        else:
            past_meetings = []
        
        # Ajouter la nouvelle réunion passée
        past_meetings.append(meeting_data)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(past_meetings, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True, 'meeting': meeting_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== SERVIR LES FICHIERS STATIQUES =====

@app.route('/')
def index():
    """Servir la page d'accueil"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Servir les fichiers statiques"""
    return send_from_directory('.', path)

# ===== HEALTH CHECK =====

@app.route('/health')
def health():
    """Endpoint de santé pour Railway"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
