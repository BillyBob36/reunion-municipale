// Configuration de l'application
const MIROTALK_CONFIG = {
    // Configuration MiroTalk SFU
    domain: 'sfu.mirotalk.com',
    baseUrl: 'https://sfu.mirotalk.com'
};

// URL de l'API backend (automatiquement détectée)
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'  // Développement local
    : (window.API_URL || '');  // Production (sera injecté par Netlify)

// Variables globales
let currentMeeting = null;
let videoModal = null;

// Gestion du mode administrateur
let isAdminMode = false;

// Initialiser le mode admin depuis localStorage
function initializeAdminMode() {
    const savedAdminMode = localStorage.getItem('menilapp_admin_mode');
    isAdminMode = savedAdminMode === 'true';
    updateAdminUI();
}

// Basculer le mode administrateur
function toggleAdminMode() {
    isAdminMode = !isAdminMode;
    localStorage.setItem('menilapp_admin_mode', isAdminMode.toString());
    updateAdminUI();
    showNotification(
        isAdminMode ? 'Mode administrateur activé' : 'Mode administrateur désactivé',
        isAdminMode ? 'success' : 'info'
    );
}

// Mettre à jour l'interface selon le mode admin
function updateAdminUI() {
    // Masquer/afficher la section "Créer une réunion"
    const createMeetingSection = document.querySelector('.create-meeting');
    if (createMeetingSection) {
        createMeetingSection.style.display = isAdminMode ? 'block' : 'none';
    }
    
    // Masquer/afficher la section "Gestion des administrés"
    const residentsSection = document.getElementById('residentsSection');
    if (residentsSection) {
        residentsSection.style.display = isAdminMode ? 'block' : 'none';
    }
    
    // Masquer/afficher l'onglet "Créer un vote" dans le modal de réunion
    const createVoteTab = document.querySelector('[data-tab="create-vote"]');
    if (createVoteTab) {
        createVoteTab.style.display = isAdminMode ? 'flex' : 'none';
        
        // Si l'onglet de création de vote est actif et qu'on n'est plus admin, 
        // basculer vers l'onglet des votes actifs
        if (!isAdminMode && createVoteTab.classList.contains('active')) {
            const activeVotesTab = document.querySelector('.vote-tab[data-tab="active-votes"]');
            if (activeVotesTab) {
                activeVotesTab.click();
            }
        }
    }
    
    // Masquer/afficher le bouton "Finir la réunion"
    const endMeetingBtn = document.getElementById('endMeetingBtn');
    if (endMeetingBtn) {
        endMeetingBtn.style.display = isAdminMode ? 'inline-flex' : 'none';
    }
    
    // Mettre à jour le bouton d'édition des comptes-rendus dans les réunions passées
    const editReportBtn = document.getElementById('editReportBtn');
    if (editReportBtn) {
        editReportBtn.style.display = isAdminMode ? 'inline-block' : 'none';
    }
    
    // Recharger les votes pour mettre à jour l'affichage des boutons "Fermer le vote"
    loadMeetingVotes();
    
    // Mettre à jour les boutons admin
    updateAdminButtons();
    
    // Mettre à jour l'interface des réunions passées
    updatePastMeetingsUI();
    
    // Recharger l'affichage des réunions pour mettre à jour les boutons supprimer
    displaySavedMeetings();
    
    // Recharger l'affichage des administrés pour mettre à jour les boutons supprimer
    if (document.getElementById('residentsModal').style.display !== 'none') {
        displayResidentsList();
    }
}

// Mettre à jour l'état des boutons admin
function updateAdminButtons() {
    const adminButtons = document.querySelectorAll('.admin-toggle-btn');
    adminButtons.forEach(btn => {
        const icon = btn.querySelector('i');
        const text = btn.querySelector('.btn-text');
        
        if (isAdminMode) {
            btn.classList.add('admin-active');
            btn.classList.remove('btn-outline');
            btn.classList.add('btn-danger');
            if (icon) icon.className = 'fas fa-user-shield';
            if (text) text.textContent = 'Admin';
            btn.title = 'Cliquez pour désactiver le mode administrateur';
        } else {
            btn.classList.remove('admin-active', 'btn-danger');
            btn.classList.add('btn-outline');
            if (icon) icon.className = 'fas fa-user';
            if (text) text.textContent = 'Admin';
            btn.title = 'Cliquez pour activer le mode administrateur';
        }
    });
}

// Fonctions de gestion du stockage des réunions (maintenant via API)
async function saveMeetingToStorage(meeting) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/meetings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(meeting)
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        // Fallback vers localStorage en cas d'erreur
        const meetings = JSON.parse(localStorage.getItem('meetings') || '[]');
        meetings.push(meeting);
        localStorage.setItem('meetings', JSON.stringify(meetings));
        throw error;
    }
}

// ===== GESTION DES ADMINISTRÉS =====

// Variables globales pour les administrés
let residents = [];
let editingResidentId = null;

// Charger les administrés depuis le serveur
async function loadResidents() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/residents`);
        if (response.ok) {
            residents = await response.json();
        } else {
            console.error('Erreur lors du chargement des administrés:', response.statusText);
            residents = [];
        }
    } catch (error) {
        console.error('Erreur lors du chargement des administrés:', error);
        residents = [];
    }
}

// Sauvegarder les administrés sur le serveur
async function saveResidents() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/residents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(residents)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde des administrés');
        }
        
        showNotification('Administrés sauvegardés avec succès', 'success');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des administrés:', error);
        showError('Erreur lors de la sauvegarde des administrés');
    }
}

// Ouvrir le modal de gestion des administrés
async function openResidentsModal() {
    await loadResidents();
    displayResidentsList();
    const modal = document.getElementById('residentsModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// Fermer le modal de gestion des administrés
function closeResidentsModal() {
    const modal = document.getElementById('residentsModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    resetResidentForm();
}

// Afficher la liste des administrés
function displayResidentsList() {
    const container = document.getElementById('residentsList');
    
    if (residents.length === 0) {
        container.innerHTML = '<p class="no-residents">Aucun administré trouvé.</p>';
        return;
    }
    
    // Trier les administrés par ordre alphabétique de leur nom de famille
    const sortedResidents = [...residents].sort((a, b) => {
        return a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' });
    });
    
    const html = sortedResidents.map(resident => `
        <div class="resident-item" data-id="${resident.id}">
            <div class="resident-info">
                <span class="resident-name">${resident.lastName} ${resident.firstName}</span>
            </div>
            <div class="resident-actions">
                <button class="btn btn-outline btn-edit" onclick="editResident(${resident.id})">
                    <i class="fas fa-edit"></i> Éditer
                </button>
                ${isAdminMode ? `<button class="btn btn-outline btn-delete" onclick="deleteResident(${resident.id})">
                    <i class="fas fa-trash"></i> Supprimer
                </button>` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Ajouter des administrés
async function handleAddResidents(e) {
    e.preventDefault();
    
    const input = document.getElementById('newResidentsInput');
    const inputValue = input.value.trim();
    
    if (!inputValue) {
        showError('Veuillez saisir au moins un administré');
        return;
    }
    
    // Parser l'entrée pour extraire les noms
    const entries = inputValue.split(',').map(entry => entry.trim()).filter(entry => entry);
    const newResidents = [];
    
    for (const entry of entries) {
        const parts = entry.split(' ').filter(part => part);
        if (parts.length >= 2) {
            const firstName = parts[0];
            const lastName = parts.slice(1).join(' ');
            
            // Générer un nouvel ID
            const newId = residents.length > 0 ? Math.max(...residents.map(r => r.id)) + 1 : 1;
            
            newResidents.push({
                id: newId + newResidents.length,
                firstName: firstName,
                lastName: lastName
            });
        }
    }
    
    if (newResidents.length === 0) {
        showError('Format invalide. Utilisez: Prénom Nom, Prénom Nom, ...');
        return;
    }
    
    // Ajouter les nouveaux administrés
    residents.push(...newResidents);
    
    // Sauvegarder et rafraîchir
    await saveResidents();
    displayResidentsList();
    
    // Réinitialiser le formulaire
    input.value = '';
    showNotification(`${newResidents.length} administré(s) ajouté(s) avec succès`, 'success');
}

// Éditer un administré
function editResident(id) {
    const resident = residents.find(r => r.id == id); // Utilisation de == au lieu de ===
    if (!resident) return;
    
    editingResidentId = id;
    document.getElementById('editFirstName').value = resident.firstName;
    document.getElementById('editLastName').value = resident.lastName;
    
    const modal = document.getElementById('editResidentModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// Sauvegarder les modifications d'un administré
async function handleEditResident(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    
    if (!firstName || !lastName) {
        showError('Veuillez remplir tous les champs');
        return;
    }
    
    const residentIndex = residents.findIndex(r => r.id == editingResidentId); // Utilisation de == au lieu de ===
    if (residentIndex !== -1) {
        residents[residentIndex].firstName = firstName;
        residents[residentIndex].lastName = lastName;
        
        await saveResidents();
        displayResidentsList();
        closeEditResidentModal();
        showNotification('Administré modifié avec succès', 'success');
    }
}

// Fermer le modal d'édition
function closeEditResidentModal() {
    const modal = document.getElementById('editResidentModal');
    modal.style.display = 'none';
    modal.classList.remove('show');
    resetResidentForm();
}

// Supprimer un administré
async function deleteResident(id) {
    const resident = residents.find(r => r.id == id); // Utilisation de == au lieu de ===
    if (!resident) return;
    
    // Demander confirmation avec le nom complet de l'administré
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'administré "${resident.firstName} ${resident.lastName}" ?`)) {
        return;
    }
    
    residents = residents.filter(r => r.id != id); // Utilisation de != au lieu de !==
    await saveResidents();
    displayResidentsList();
    showNotification('Administré supprimé avec succès', 'success');
}

// Réinitialiser le formulaire
function resetResidentForm() {
    editingResidentId = null;
    document.getElementById('editFirstName').value = '';
    document.getElementById('editLastName').value = '';
}

// Afficher le formulaire d'ajout d'administrés
function showAddResidentForm() {
    const form = document.getElementById('addResidentForm');
    const button = document.getElementById('addResidentBtn');
    
    if (form && button) {
        form.style.display = 'block';
        button.style.display = 'none';
        
        // Focus sur le champ de saisie
        const input = document.getElementById('newResidentInput');
        if (input) {
            input.focus();
        }
    }
}

// Masquer le formulaire d'ajout d'administrés
function hideAddResidentForm() {
    const form = document.getElementById('addResidentForm');
    const button = document.getElementById('addResidentBtn');
    const input = document.getElementById('newResidentInput');
    
    if (form && button) {
        form.style.display = 'none';
        button.style.display = 'block';
        
        // Vider le champ de saisie
        if (input) {
            input.value = '';
        }
    }
}

// Ajouter des administrés (fonction appelée par le bouton)
async function addResidents() {
    const input = document.getElementById('newResidentInput');
    const inputValue = input.value.trim();
    
    if (!inputValue) {
        showError('Veuillez saisir au moins un administré');
        return;
    }
    
    // Parser l'entrée pour extraire les noms
    const entries = inputValue.split(',').map(entry => entry.trim()).filter(entry => entry);
    const newResidents = [];
    
    for (const entry of entries) {
        const parts = entry.split(' ').filter(part => part);
        if (parts.length >= 2) {
            const firstName = parts[0];
            const lastName = parts.slice(1).join(' ');
            
            // Générer un nouvel ID
            const newId = residents.length > 0 ? Math.max(...residents.map(r => r.id)) + 1 : 1;
            
            newResidents.push({
                id: newId + newResidents.length,
                firstName: firstName,
                lastName: lastName
            });
        }
    }
    
    if (newResidents.length === 0) {
        showError('Format invalide. Utilisez: Prénom Nom, Prénom Nom, ...');
        return;
    }
    
    // Ajouter les nouveaux administrés
    residents.push(...newResidents);
    
    // Sauvegarder et rafraîchir
    await saveResidents();
    displayResidentsList();
    
    // Masquer le formulaire et réinitialiser
    hideAddResidentForm();
    showNotification(`${newResidents.length} administré(s) ajouté(s) avec succès`, 'success');
}

// Charger les administrés dans la liste déroulante du modal de nom d'utilisateur
async function loadResidentsInUserModal() {
    await loadResidents();
    
    const select = document.getElementById('userNameSelect');
    if (!select) return;
    
    // Vider la liste existante
    select.innerHTML = '<option value="">Choisissez votre nom...</option>';
    
    // Ajouter les administrés triés par nom
    const sortedResidents = [...residents].sort((a, b) => 
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    );
    
    sortedResidents.forEach(resident => {
        const option = document.createElement('option');
        option.value = `${resident.firstName} ${resident.lastName}`;
        option.textContent = `${resident.lastName} ${resident.firstName}`;
        select.appendChild(option);
    });
}

// Initialiser les événements pour les administrés
document.addEventListener('DOMContentLoaded', function() {
    // Événements pour le modal des administrés
    const addResidentsForm = document.getElementById('addResidentsForm');
    if (addResidentsForm) {
        addResidentsForm.addEventListener('submit', handleAddResidents);
    }
    
    const editResidentForm = document.getElementById('editResidentForm');
    if (editResidentForm) {
        editResidentForm.addEventListener('submit', handleEditResident);
    }
    
    // Fermeture des modals en cliquant à l'extérieur
    window.addEventListener('click', function(e) {
        const residentsModal = document.getElementById('residentsModal');
        const editResidentModal = document.getElementById('editResidentModal');
        
        if (e.target === residentsModal) {
            closeResidentsModal();
        }
        
        if (e.target === editResidentModal) {
            closeEditResidentModal();
        }
    });
});

async function getMeetingsFromStorage() {
    try {
        // Ajouter un timeout pour éviter les attentes trop longues
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes max
        
        const response = await fetch(`${API_BASE_URL}/api/meetings`, {
            signal: controller.signal,
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération:', error);
        // Fallback vers localStorage en cas d'erreur
        return JSON.parse(localStorage.getItem('meetings') || '[]');
    }
}

async function deleteMeetingFromStorage(meetingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        // Fallback vers localStorage en cas d'erreur
        const meetings = JSON.parse(localStorage.getItem('meetings') || '[]');
        const updatedMeetings = meetings.filter(m => m.id !== meetingId);
        localStorage.setItem('meetings', JSON.stringify(updatedMeetings));
        throw error;
    }
}

// Fonction pour synchroniser automatiquement les réunions
async function syncMeetings() {
    try {
        await displaySavedMeetings();
        
        // Synchroniser aussi les votes si on est dans une réunion
        if (currentMeeting) {
            await loadMeetingVotes();
        }
    } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
        showNotification('Erreur de synchronisation avec le serveur', 'error');
    }
}

// Synchronisation supprimée - les réunions sont maintenant mises à jour uniquement lors d'actions utilisateur

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    // Synchronisation supprimée - les réunions sont chargées uniquement au démarrage
});

function initializeApp() {
    // Initialiser le mode administrateur
    initializeAdminMode();
    
    // Récupération des éléments DOM avec vérification
    const createMeetingForm = document.getElementById('createMeetingForm');
    const videoModal = document.getElementById('videoModal');
    const closeModalBtn = document.getElementById('closeModal');

    // Gestionnaires d'événements avec vérification d'existence
    if (createMeetingForm) {
        createMeetingForm.addEventListener('submit', handleCreateMeeting);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeVideoModal);
    }

    // Fermer le modal en cliquant à l'extérieur
    if (videoModal) {
        videoModal.addEventListener('click', function(e) {
            if (e.target === videoModal) {
                closeVideoModal();
            }
        });
    }

    // Charger les réunions une seule fois au démarrage
    displaySavedMeetings();
}

// Fonction pour afficher les réunions sauvegardées
async function displaySavedMeetings() {
    try {
        // Afficher un indicateur de chargement
        const meetingsList = document.getElementById('savedMeetingsList');
        const savedMeetingsSection = document.getElementById('savedMeetingsSection');
        
        if (!meetingsList) return;
        
        // Afficher un indicateur de chargement
        meetingsList.innerHTML = '<p class="loading-meetings"><i class="fas fa-spinner fa-spin"></i> Chargement des réunions...</p>';
        savedMeetingsSection.style.display = 'block';
        
        const meetings = await getMeetingsFromStorage();
        
        if (meetings.length === 0) {
            meetingsList.innerHTML = '<p class="no-meetings">Aucune réunion planifiée pour le moment.</p>';
            savedMeetingsSection.style.display = 'block';
            return;
        }
        
        // Utiliser DocumentFragment pour optimiser les performances DOM
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        
        tempDiv.innerHTML = meetings.map(meeting => {
            // Formatage de la date planifiée si elle existe
            let scheduledDateHtml = '';
            let isJoinDisabled = false;
            let disabledMessage = '';
            
            if (meeting.scheduledDate) {
                const scheduledDate = new Date(meeting.scheduledDate);
                const now = new Date();
                const timeDifference = scheduledDate.getTime() - now.getTime();
                const minutesDifference = Math.floor(timeDifference / (1000 * 60));
                
                // Vérifier si la réunion est dans plus de 10 minutes
                if (minutesDifference > 10) {
                    isJoinDisabled = true;
                    disabledMessage = "Cette réunion n'est pas encore ouverte elle le sera 10 Min avant l'heure et la date prévue";
                }
                
                const formattedDate = scheduledDate.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                scheduledDateHtml = `<span class="meeting-scheduled"><i class="fas fa-calendar-alt"></i> Planifiée le ${formattedDate}</span>`;
            }
            
            // Affichage des sujets si ils existent
            let subjectsHtml = '';
            if (meeting.subjects && meeting.subjects.trim()) {
                subjectsHtml = `<div class="meeting-subjects"><i class="fas fa-list-ul"></i> <strong>Sujets :</strong> ${meeting.subjects}</div>`;
            }
            
            // Bouton rejoindre avec état désactivé si nécessaire
            const joinButtonClass = isJoinDisabled ? 'btn btn-primary btn-join disabled' : 'btn btn-primary btn-join';
            const joinButtonOnClick = isJoinDisabled ? '' : `onclick="joinSavedMeeting('${meeting.id}', '${meeting.name}')"`;
            const joinButtonTitle = isJoinDisabled ? disabledMessage : '';
            
            return `
                <div class="meeting-item" data-meeting-id="${meeting.id}">
                    <div class="meeting-content">
                        <h3 class="meeting-name">${meeting.name}</h3>
                        ${scheduledDateHtml ? `<div class="meeting-details">${scheduledDateHtml}</div>` : ''}
                        ${subjectsHtml}
                        <div class="meeting-actions">
                            <button class="${joinButtonClass}" ${joinButtonOnClick} title="${joinButtonTitle}">
                                <i class="fas fa-door-open"></i> Rejoindre
                            </button>
                            ${isAdminMode ? `<button class="btn btn-danger btn-delete" onclick="deleteSavedMeeting('${meeting.id}')" title="Supprimer la réunion">
                                <i class="fas fa-trash"></i>
                            </button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Transférer les éléments du div temporaire vers le fragment
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
        
        // Remplacer le contenu en une seule opération
        meetingsList.innerHTML = '';
        meetingsList.appendChild(fragment);
        
    } catch (error) {
        console.error('Erreur lors de l\'affichage des réunions:', error);
        const meetingsList = document.getElementById('savedMeetingsList');
        if (meetingsList) {
            meetingsList.innerHTML = '<p class="error-meetings"><i class="fas fa-exclamation-triangle"></i> Erreur lors du chargement des réunions.</p>';
        }
    }
}

// Variables globales pour le modal de nom d'utilisateur
let userNameModalResolve = null;
let userNameModalReject = null;

// Fonction pour afficher le modal de nom d'utilisateur
function showUserNameModal(meetingName) {
    return new Promise(async (resolve, reject) => {
        const modal = document.getElementById('userNameModal');
        const modalTitle = document.getElementById('userNameModalTitle');
        const userNameSelect = document.getElementById('userNameSelect');
        const userNameForm = document.getElementById('userNameForm');
        const cancelBtn = document.getElementById('cancelUserName');

        // Charger les administrés dans la liste déroulante
        await loadResidentsInUserModal();

        // Nettoyer les anciens event listeners
        const oldForm = userNameForm.cloneNode(true);
        userNameForm.parentNode.replaceChild(oldForm, userNameForm);
        const newForm = document.getElementById('userNameForm');
        const newCancelBtn = document.getElementById('cancelUserName');

        // Variables pour éviter les appels multiples
        let isResolved = false;

        userNameModalResolve = resolve;
        userNameModalReject = reject;

        modalTitle.textContent = `Rejoindre "${meetingName}"`;
        document.getElementById('userNameSelect').value = '';
        
        // Afficher le modal
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus sur le select
        setTimeout(() => document.getElementById('userNameSelect').focus(), 100);

        // Gérer la soumission du formulaire
        const handleSubmit = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (isResolved) return; // Éviter les appels multiples
            
            const selectedName = document.getElementById('userNameSelect').value.trim();
            
            if (selectedName) {
                currentUserName = selectedName; // Stocker le nom pour le système de vote
                console.log('Nom utilisateur validé:', selectedName);
                isResolved = true;
                closeUserNameModal();
                resolve(selectedName);
            } else {
                alert('Veuillez sélectionner votre nom dans la liste.');
            }
        };

        // Gérer l'annulation
        const handleCancel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (isResolved) return; // Éviter les appels multiples
            
            console.log('Rejoindre la réunion annulé');
            isResolved = true;
            closeUserNameModal();
            reject(new Error('Cancelled'));
        };

        // Ajouter les event listeners
        newForm.addEventListener('submit', handleSubmit);
        newCancelBtn.addEventListener('click', handleCancel);

        // Nettoyer les event listeners quand le modal se ferme
        modal.addEventListener('hidden', () => {
            newForm.removeEventListener('submit', handleSubmit);
            newCancelBtn.removeEventListener('click', handleCancel);
        }, { once: true });
    });
}

// Fonction pour fermer le modal de nom d'utilisateur
function closeUserNameModal() {
    const modal = document.getElementById('userNameModal');
    
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Déclencher l'événement hidden
    modal.dispatchEvent(new Event('hidden'));
}

// Fonction pour rejoindre une réunion sauvegardée (modifiée)
// Fonction simplifiée pour rejoindre une réunion
function joinSavedMeeting(meetingId, meetingName) {
    console.log('Tentative de rejoindre la réunion:', meetingId, meetingName);
    
    // Afficher le modal pour saisir le nom
    const modal = document.getElementById('userNameModal');
    const modalTitle = document.getElementById('userNameModalTitle');
    const userNameSelect = document.getElementById('userNameSelect');
    
    modalTitle.textContent = `Rejoindre "${meetingName}"`;
    userNameSelect.value = '';
    
    // Charger les administrés dans la liste déroulante
    loadResidentsInUserModal();
    
    // Afficher le modal
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus sur la liste déroulante
    setTimeout(() => userNameSelect.focus(), 100);
    
    // Gérer la soumission du formulaire
    const form = document.getElementById('userNameForm');
    const cancelBtn = document.getElementById('cancelUserName');
    
    // Supprimer les anciens event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    const newCancelBtn = document.getElementById('cancelUserName');
    
    // Ajouter les nouveaux event listeners
    newForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const selectedValue = document.getElementById('userNameSelect').value;
        
        if (selectedValue) {
            const fullName = selectedValue;
            console.log('Nom utilisateur validé:', fullName);
            
            // Fermer le modal
            closeUserNameModal();
            
            // Générer l'URL de la réunion
            const meetingUrl = generateMeetingUrl(meetingId, fullName);
            
            // Définir currentMeeting
            currentMeeting = {
                id: meetingId,
                name: meetingName,
                url: meetingUrl,
                userName: fullName
            };
            localStorage.setItem('currentMeeting', JSON.stringify(currentMeeting));
            
            // Ajouter le participant
            currentUserName = fullName;
            addParticipant(fullName);
            
            // Ouvrir la visioconférence
            console.log('Ouverture de la visioconférence:', meetingUrl);
            openVideoModal(meetingUrl, `Réunion: ${meetingName}`);
        } else {
            alert('Veuillez sélectionner un nom dans la liste.');
        }
    });
    
    newCancelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Rejoindre la réunion annulé');
        closeUserNameModal();
    });
}

// Fonction pour supprimer une réunion sauvegardée
async function deleteSavedMeeting(meetingId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) {
        try {
            await deleteMeetingFromStorage(meetingId);
            await displaySavedMeetings(); // Mettre à jour l'affichage
            showNotification('Réunion supprimée avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            showNotification('Erreur lors de la suppression', 'error');
        }
    }
}

// Gestion de la création de réunion
async function handleCreateMeeting(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const meetingData = {
        name: formData.get('meetingName'),
        subjects: formData.get('meetingSubjects') || '',
        scheduledDate: formData.get('scheduledDate') || null
    };

    // Générer un ID unique pour la réunion
    const roomId = generateRoomId(meetingData.name);
    
    try {
        showLoading(e.target);
        
        // Créer la réunion
        const meeting = await createMeeting(roomId, meetingData);
        
        // Afficher les informations de la réunion créée
        displayCreatedMeeting(meeting);
        
    } catch (error) {
        console.error('Erreur lors de la création de la réunion:', error);
        showError('Erreur lors de la création de la réunion. Veuillez réessayer.');
    } finally {
        hideLoading(e.target);
    }
}

// Créer une réunion
async function createMeeting(roomId, meetingData) {
    const meeting = {
        id: roomId,
        name: meetingData.name,
        subjects: meetingData.subjects,
        scheduledDate: meetingData.scheduledDate,
        createdAt: new Date().toISOString(),
        url: generateMeetingUrl(roomId, 'Admin')
    };

    // Sauvegarder la réunion localement
    currentMeeting = meeting;
    localStorage.setItem('currentMeeting', JSON.stringify(meeting));
    
    // Sauvegarder dans la liste des réunions via API
    try {
        await saveMeetingToStorage(meeting);
        // Mettre à jour l'affichage des réunions sauvegardées
        await displaySavedMeetings();
        // Notification supprimée - elle sera affichée dans displayCreatedMeeting
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('Réunion créée mais non sauvegardée sur le serveur', 'warning');
    }

    return meeting;
}



// Générer un ID de réunion unique
function generateRoomId(meetingName) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const cleanName = meetingName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 20);
    
    return `${cleanName}-${randomStr}-${timestamp}`.substring(0, 50);
}

// Générer l'URL de la réunion MiroTalk
function generateMeetingUrl(roomId, userName) {
    const params = new URLSearchParams({
        room: roomId,
        name: userName,
        audio: '1',  // Audio activé par défaut
        video: '1',  // Vidéo activée par défaut
        screen: '0',
        chat: '0',  // Désactiver le chat pour éviter les popups
        hide: '0',
        notify: '0',  // Désactiver les notifications et messages de bienvenue
        share: '0'  // Désactiver la popup "Share the room"
    });

    // Plus de mot de passe nécessaire
    
    return `${MIROTALK_CONFIG.baseUrl}/join?${params.toString()}`;
}

// Afficher les informations de la réunion créée
function displayCreatedMeeting(meeting) {
    // Afficher une notification de succès
    showNotification('Réunion créée avec succès !', 'success');
    
    // Ne pas démarrer automatiquement la réunion
    // L'administrateur peut continuer à naviguer sur la page d'accueil
}

// Démarrer la réunion
function startMeeting() {
    if (currentMeeting) {
        openVideoModal(currentMeeting.url, `Réunion: ${currentMeeting.name}`);
    }
}

// Ouvrir le modal vidéo
function openVideoModal(meetingUrl, title) {
    const modal = document.getElementById('videoModal');
    const modalTitle = document.getElementById('modalTitle');
    const videoContainer = document.getElementById('videoContainer');

    console.log('Ouverture du modal vidéo:', { meetingUrl, title });

    modalTitle.textContent = title;
    
    // Créer l'iframe MiroTalk avec des paramètres pour masquer la popup de partage
    const iframe = document.createElement('iframe');
    iframe.id = 'meetingFrame';
    iframe.src = meetingUrl;
    iframe.allow = 'camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write; web-share; autoplay';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.minHeight = '500px';

    console.log('Iframe créée:', iframe);

    // Ajouter un script pour masquer la popup dans l'iframe
    iframe.onload = function() {
        console.log('Iframe chargée avec succès');
        try {
            // Injecter du CSS dans l'iframe pour masquer la popup
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const style = iframeDoc.createElement('style');
            style.textContent = `
                .modal[id*="share"], 
                .share-room-dialog, 
                .share-room-modal,
                [id*="shareRoom"],
                [class*="shareRoom"],
                [class*="share-room"],
                .qr-code-container {
                    display: none !important;
                    visibility: hidden !important;
                }
            `;
            iframeDoc.head.appendChild(style);
        } catch (e) {
            console.log('Impossible d\'accéder au contenu de l\'iframe (CORS)');
        }
    };

    iframe.onerror = function() {
        console.error('Erreur lors du chargement de l\'iframe');
    };

    // Vider le conteneur et ajouter l'iframe
    videoContainer.innerHTML = '';
    videoContainer.appendChild(iframe);

    console.log('Iframe ajoutée au conteneur');

    // Afficher le modal avec les bonnes classes CSS
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    videoModal = modal;

    console.log('Modal affiché');
}

// Fermer le modal vidéo
function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const videoContainer = document.getElementById('videoContainer');

    console.log('Fermeture du modal vidéo');

    // Mettre à jour le temps de connexion du participant avant de fermer
    if (currentMeeting && currentUserName) {
        updateParticipantConnectionTime(currentMeeting.id, currentUserName);
    }

    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Nettoyer l'iframe
    videoContainer.innerHTML = '';
    
    console.log('Modal fermé et iframe nettoyée');
}

// Cette fonction n'est plus nécessaire car les éléments ont été supprimés
// async function copyShareLink() { ... }

// Retourner à l'accueil
function resetToHome() {
    const createMeetingSection = document.querySelector('.create-meeting');

    // Fermer la réunion en cours si elle existe
    closeVideoModal();

    // Réinitialiser les formulaires
    document.getElementById('createMeetingForm').reset();

    // Réafficher les formulaires
    createMeetingSection.style.display = 'block';

    // Nettoyer les données de la réunion
    currentMeeting = null;
    localStorage.removeItem('currentMeeting');

    // Déconnecter l'utilisateur (sauf si admin)
    if (!isAdminMode) {
        currentUserName = null;
        localStorage.removeItem('currentUserName');
        console.log('Utilisateur déconnecté');
    } else {
        console.log('Mode administrateur maintenu');
    }

    // Faire défiler vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Actualiser l'affichage des réunions
    displaySavedMeetings();
}

// Afficher l'état de chargement
function showLoading(form) {
    form.classList.add('loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
}

// Masquer l'état de chargement
function hideLoading(form) {
    form.classList.remove('loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
}

// Afficher une erreur
function showError(message) {
    showNotification(message, 'error');
}

// Afficher une notification
function showNotification(message, type = 'success') {
    // Créer un conteneur pour les notifications s'il n'existe pas
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(notificationContainer);
    }

    // Supprimer les notifications existantes du même type pour éviter les doublons
    const existingNotifications = notificationContainer.querySelectorAll(`.notification-${type}`);
    existingNotifications.forEach(notification => {
        if (notification.textContent.includes(message.substring(0, 20))) {
            notification.remove();
        }
    });

    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'check-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Ajouter les styles
    notification.style.cssText = `
        background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#28a745'};
        color: ${type === 'warning' ? '#212529' : 'white'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
        pointer-events: auto;
        min-width: 300px;
        max-width: 400px;
        word-wrap: break-word;
        margin-bottom: 5px;
    `;

    // Ajouter au conteneur
    notificationContainer.appendChild(notification);

    // Supprimer après 4 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            // Supprimer le conteneur s'il est vide
            if (notificationContainer.children.length === 0) {
                notificationContainer.remove();
            }
        }, 300);
    }, 4000);
}

// Ajouter les animations CSS pour les notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes slideInDown {
        from {
            transform: translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutUp {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(-100%);
            opacity: 0;
        }
    }
    
    /* Responsive design pour les notifications */
    @media (max-width: 768px) {
        #notification-container {
            top: 10px !important;
            right: 10px !important;
            left: 10px !important;
            right: 10px !important;
        }
        
        #error-container {
            top: 10px !important;
            left: 10px !important;
            right: 10px !important;
            transform: none !important;
        }
        
        .notification, .error-message {
            min-width: auto !important;
            max-width: none !important;
            width: 100% !important;
            font-size: 14px !important;
            padding: 12px 15px !important;
        }
    }
`;
document.head.appendChild(style);

// Gestion des raccourcis clavier
document.addEventListener('keydown', function(e) {
    // Échapper pour fermer le modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('videoModal');
        if (modal.style.display === 'block') {
            closeVideoModal();
        }
        // Fermer le modal de nom d'utilisateur avec Escape
        const userNameModal = document.getElementById('userNameModal');
        if (userNameModal && userNameModal.style.display !== 'none') {
            closeUserNameModal();
            if (userNameModalReject) {
                userNameModalReject(new Error('Cancelled'));
            }
        }
    }
});

// Gestion de la fermeture de l'onglet/fenêtre
window.addEventListener('beforeunload', function(e) {
    const modal = document.getElementById('videoModal');
    if (modal && modal.style.display === 'block') {
        e.preventDefault();
        e.returnValue = 'Êtes-vous sûr de vouloir quitter la réunion ?';
        return e.returnValue;
    }
});

// Variables globales pour le système de vote
let currentUserName = null;
let meetingVotes = new Map(); // Stockage des votes par réunion

// Utilitaires pour le développement et le débogage
window.MenilApp = {
    getCurrentMeeting: () => currentMeeting,
    openMeeting: (url, title) => openVideoModal(url, title),
    closeMeeting: () => closeVideoModal(),
    resetApp: () => resetToHome(),
    config: MIROTALK_CONFIG,
    // API pour le système de vote
    votes: {
        getVotes: (meetingId) => meetingVotes.get(meetingId) || [],
        createVote: createVote,
        submitVote: submitVote,
        cancelVote: cancelVote,
        closeVote: closeVote
    }
};

// Exposer les fonctions des administrés globalement pour les onclick
window.editResident = editResident;
window.deleteResident = deleteResident;

// ===== SYSTÈME DE VOTE =====

// Initialiser le système de vote
function initializeVoteSystem() {
    const voteBtn = document.getElementById('voteBtn');
    const voteModal = document.getElementById('voteModal');
    const closeVoteModal = document.getElementById('closeVoteModal');
    
    // Event listeners pour le modal de vote
    voteBtn?.addEventListener('click', openVoteModal);
    closeVoteModal?.addEventListener('click', closeVoteModalHandler);
    
    // Event listeners pour les onglets
    const voteTabs = document.querySelectorAll('.vote-tab');
    voteTabs.forEach(tab => {
        tab.addEventListener('click', () => switchVoteTab(tab.dataset.tab));
    });
    
    // Event listeners pour la création de vote
    const createVoteForm = document.getElementById('createVoteForm');
    const addOptionBtn = document.getElementById('addOptionBtn');
    const cancelCreateVote = document.getElementById('cancelCreateVote');
    
    createVoteForm?.addEventListener('submit', handleCreateVote);
    addOptionBtn?.addEventListener('click', addVoteOption);
    cancelCreateVote?.addEventListener('click', () => switchVoteTab('active-votes'));
    
    // Event listeners pour supprimer les options
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-option-btn')) {
            removeVoteOption(e.target.closest('.remove-option-btn'));
        }
    });
    
    // Fermer le modal en cliquant à l'extérieur
    voteModal?.addEventListener('click', function(e) {
        if (e.target === voteModal) {
            closeVoteModalHandler();
        }
    });
}

// Ouvrir le modal de vote
function openVoteModal() {
    // Vérifier si le bouton de vote est disponible (modal vidéo ouvert)
    const videoModal = document.getElementById('videoModal');
    if (!videoModal || videoModal.style.display !== 'flex') {
        showError('Veuillez d\'abord rejoindre une réunion');
        return;
    }
    
    if (!currentMeeting) {
        showError('Aucune réunion active');
        return;
    }
    
    const modal = document.getElementById('voteModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Charger les votes de la réunion actuelle
    loadMeetingVotes();
    
    // Afficher l'onglet des votes actifs par défaut
    switchVoteTab('active-votes');
}

// Fermer le modal de vote
function closeVoteModalHandler() {
    const modal = document.getElementById('voteModal');
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Changer d'onglet dans le modal de vote
function switchVoteTab(tabName) {
    // Mettre à jour les onglets
    const tabs = document.querySelectorAll('.vote-tab');
    const sections = document.querySelectorAll('.vote-section');
    
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    sections.forEach(section => {
        section.classList.toggle('active', section.id === tabName);
    });
    
    // Réinitialiser le formulaire si on va sur l'onglet création
    if (tabName === 'create-vote') {
        resetCreateVoteForm();
    }
}

// Charger les votes de la réunion actuelle
async function loadMeetingVotes() {
    if (!currentMeeting || !currentMeeting.id) {
        console.log('Aucune réunion active, pas de chargement des votes');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/votes?meetingId=${currentMeeting.id}`);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const votes = await response.json();
        
        // Mettre à jour le cache local
        meetingVotes.set(currentMeeting.id, votes);
        
        // Afficher les votes
        const activeVotes = votes.filter(vote => vote.status === 'active');
        const closedVotes = votes.filter(vote => vote.status === 'closed');
        
        displayActiveVotes(activeVotes);
        displayVoteHistory(closedVotes);
        
    } catch (error) {
        console.log('Mode local: utilisation du cache pour les votes');
        // En cas d'erreur, utiliser le cache local
        const votes = meetingVotes.get(currentMeeting.id) || [];
        const activeVotes = votes.filter(vote => vote.status === 'active');
        const closedVotes = votes.filter(vote => vote.status === 'closed');
        
        displayActiveVotes(activeVotes);
        displayVoteHistory(closedVotes);
    }
}

// Afficher les votes actifs
function displayActiveVotes(votes) {
    const container = document.querySelector('#active-votes .votes-list');
    
    if (votes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-vote-yea"></i>
                <h4>Aucun vote actif</h4>
                <p>Il n'y a actuellement aucun vote en cours pour cette réunion.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = votes.map(vote => createVoteItemHTML(vote)).join('');
    
    // Ajouter les event listeners pour les votes
    container.querySelectorAll('.vote-option input').forEach(input => {
        input.addEventListener('change', handleVoteSubmission);
    });
    
    container.querySelectorAll('.close-vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const voteId = e.target.closest('.vote-item').dataset.voteId;
            closeVote(voteId);
        });
    });
    
    // Ajouter les event listeners pour l'annulation de vote
    container.querySelectorAll('.cancel-vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const voteId = e.target.closest('.vote-item').dataset.voteId;
            cancelVote(voteId);
        });
    });
}

// Afficher l'historique des votes
function displayVoteHistory(votes) {
    const container = document.querySelector('#vote-history .votes-history-list');
    
    if (votes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h4>Aucun historique</h4>
                <p>Aucun vote n'a encore été terminé dans cette réunion.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = votes.map(vote => createVoteItemHTML(vote, true)).join('');
}

// Créer le HTML d'un élément de vote
function createVoteItemHTML(vote, isHistory = false) {
    const totalVotes = vote.votes ? Object.values(vote.votes).reduce((sum, count) => sum + count, 0) : 0;
    const userHasVoted = vote.voters && currentUserName && vote.voters.includes(currentUserName);
    
    return `
        <div class="vote-item" data-vote-id="${vote.id}">
            <div class="vote-item-header">
                <h4 class="vote-item-title">${vote.title}</h4>
                <span class="vote-item-status ${vote.status}">${vote.status === 'active' ? 'Actif' : 'Terminé'}</span>
            </div>
            ${vote.description ? `<p class="vote-item-description">${vote.description}</p>` : ''}
            <div class="vote-options-list">
                ${vote.options.map((option, index) => {
                    const voteCount = vote.votes ? (vote.votes[option] || 0) : 0;
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    
                    return `
                        <div class="vote-option">
                            ${vote.status === 'active' && !userHasVoted ? `
                                <input type="${vote.allowMultiple ? 'checkbox' : 'radio'}" 
                                       name="vote-${vote.id}" 
                                       value="${option}" 
                                       id="vote-${vote.id}-${index}">
                            ` : ''}
                            <label for="vote-${vote.id}-${index}" class="vote-option-text">${option}</label>
                            <span class="vote-option-count">${voteCount} vote${voteCount !== 1 ? 's' : ''} (${percentage}%)</span>
                        </div>
                    `;
                }).join('')}
            </div>
            ${vote.status === 'active' && !isHistory ? `
                <div class="vote-item-actions">
                    ${userHasVoted ? `
                        <span class="btn btn-secondary" disabled>Vous avez voté</span>
                        <button type="button" class="btn btn-outline cancel-vote-btn">Annuler mon vote</button>
                    ` : `
                        <button type="button" class="btn btn-primary submit-vote-btn">Voter</button>
                    `}
                    ${isAdminMode ? `
                        <button type="button" class="btn btn-danger close-vote-btn">Fermer le vote</button>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

// Gérer la soumission d'un vote
function handleVoteSubmission(e) {
    const voteItem = e.target.closest('.vote-item');
    const voteId = voteItem.dataset.voteId;
    const submitBtn = voteItem.querySelector('.submit-vote-btn');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const selectedOptions = Array.from(voteItem.querySelectorAll('input:checked')).map(input => input.value);
            if (selectedOptions.length > 0) {
                submitVote(voteId, selectedOptions);
            }
        });
    }
}

// Ajouter une option de vote
function addVoteOption() {
    const container = document.getElementById('voteOptions');
    const optionCount = container.children.length;
    
    if (optionCount >= 10) {
        showError('Maximum 10 options autorisées');
        return;
    }
    
    const newOption = document.createElement('div');
    newOption.className = 'vote-option-input';
    newOption.innerHTML = `
        <input type="text" class="form-control option-input" placeholder="Option ${optionCount + 1}" required>
        <button type="button" class="remove-option-btn" style="display: flex;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    container.appendChild(newOption);
    newOption.querySelector('input').focus();
    
    // Mettre à jour l'état des boutons de suppression
    updateRemoveButtons();
}

// Supprimer une option de vote
function removeVoteOption(button) {
    const container = document.getElementById('voteOptions');
    const optionDiv = button.closest('.vote-option-input');
    
    // Ne permettre la suppression que des options ajoutées (pas les options par défaut)
    if (!button.classList.contains('default-option') && container.children.length > 2) {
        optionDiv.remove();
        updateRemoveButtons();
        
        // Renuméroter les placeholders
        const inputs = container.querySelectorAll('.option-input');
        inputs.forEach((input, index) => {
            if (!input.value) {
                input.placeholder = `Option ${index + 1}`;
            }
        });
    }
}

// Mettre à jour l'état des boutons de suppression
function updateRemoveButtons() {
    const container = document.getElementById('voteOptions');
    const removeButtons = container.querySelectorAll('.remove-option-btn');
    
    removeButtons.forEach((btn, index) => {
        // Les 2 premiers boutons (options par défaut) restent toujours cachés
        if (btn.classList.contains('default-option')) {
            btn.style.display = 'none';
        } else {
            // Les boutons des options ajoutées sont visibles seulement s'il y a plus de 2 options
            btn.style.display = container.children.length > 2 ? 'flex' : 'none';
        }
    });
}

// Réinitialiser le formulaire de création de vote
function resetCreateVoteForm() {
    const form = document.getElementById('createVoteForm');
    form.reset();
    
    // Réinitialiser les options à 2 par défaut
    const container = document.getElementById('voteOptions');
    container.innerHTML = `
        <div class="vote-option-input">
            <input type="text" class="form-control option-input" placeholder="Option 1" required>
            <button type="button" class="remove-option-btn default-option" style="display: none;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="vote-option-input">
            <input type="text" class="form-control option-input" placeholder="Option 2" required>
            <button type="button" class="remove-option-btn default-option" style="display: none;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}

// Gérer la création d'un vote
async function handleCreateVote(e) {
    e.preventDefault();
    
    // Vérifier si l'utilisateur est en mode administrateur
    if (!isAdminMode) {
        showError('Seuls les administrateurs peuvent créer des votes');
        return;
    }
    
    if (!currentMeeting || !currentUserName) {
        showError('Impossible de créer un vote sans réunion active');
        return;
    }
    
    const form = e.target;
    const formData = new FormData(form);
    
    const title = formData.get('voteTitle') || document.getElementById('voteTitle').value;
    const description = formData.get('voteDescription') || document.getElementById('voteDescription').value;
    const allowMultiple = document.getElementById('allowMultipleChoices').checked;
    
    // Récupérer les options
    const optionInputs = document.querySelectorAll('.option-input');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(option => option.length > 0);
    
    if (options.length < 2) {
        showError('Au moins 2 options sont requises');
        return;
    }
    
    // Vérifier les doublons
    const uniqueOptions = [...new Set(options)];
    if (uniqueOptions.length !== options.length) {
        showError('Les options doivent être uniques');
        return;
    }
    
    const voteData = {
        title,
        description,
        options: uniqueOptions,
        allowMultiple,
        createdBy: currentUserName
    };
    
    try {
        showLoading(form);
        await createVote(voteData);
        showNotification('Vote créé avec succès');
        
        // Recharger les votes pour afficher le nouveau vote
        await loadMeetingVotes();
        
        // Basculer vers l'onglet des votes actifs
        switchVoteTab('active-votes');
    } catch (error) {
        showError('Erreur lors de la création du vote: ' + error.message);
    } finally {
        hideLoading(form);
    }
}

// Créer un nouveau vote
async function createVote(voteData) {
    if (!currentMeeting) {
        throw new Error('Aucune réunion active');
    }

    // Créer le vote localement d'abord
    const voteId = generateVoteId();
    const newVote = {
        id: voteId,
        title: voteData.title,
        description: voteData.description,
        options: voteData.options,
        allowMultiple: voteData.allowMultiple,
        createdBy: voteData.createdBy,
        meetingId: currentMeeting.id,
        createdAt: new Date().toISOString(),
        status: 'active',
        votes: {},
        voters: []
    };

    // Initialiser les compteurs de votes
    voteData.options.forEach(option => {
        newVote.votes[option] = 0;
    });

    try {
        const response = await fetch(`${API_BASE_URL}/api/votes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...voteData,
                meetingId: currentMeeting.id
            })
        });

        if (response.ok) {
            const serverVote = await response.json();
            // Utiliser la réponse du serveur si disponible
            newVote.id = serverVote.id;
        }
        
    } catch (error) {
        console.log('Mode local: vote créé localement');
    }

    // Mettre à jour le cache local dans tous les cas
    const meetingId = currentMeeting.id;
    const votes = meetingVotes.get(meetingId) || [];
    votes.push(newVote);
    meetingVotes.set(meetingId, votes);

    // Recharger l'affichage
    loadMeetingVotes();
    
    return newVote;
}

// Soumettre un vote
async function submitVote(voteId, selectedOptions) {
    if (!currentMeeting || !currentUserName) {
        showError('Impossible de voter sans être identifié');
        return;
    }

    // Mettre à jour localement d'abord
    const meetingId = currentMeeting.id;
    const votes = meetingVotes.get(meetingId) || [];
    const voteIndex = votes.findIndex(v => v.id === voteId);
    
    if (voteIndex === -1) {
        showError('Vote introuvable');
        return;
    }

    const vote = votes[voteIndex];
    
    // Supprimer le vote précédent de cet utilisateur s'il existe
    if (vote.voters && vote.voters.includes(currentUserName)) {
        vote.voters = vote.voters.filter(voter => voter !== currentUserName);
        // Décrémenter les compteurs
        vote.options.forEach(option => {
            if (vote.votes[option] > 0) {
                vote.votes[option]--;
            }
        });
    }

    // Ajouter le nouveau vote
    if (!vote.voters) vote.voters = [];
    vote.voters.push(currentUserName);
    
    selectedOptions.forEach(option => {
        if (vote.options.includes(option)) {
            vote.votes[option] = (vote.votes[option] || 0) + 1;
        }
    });

    // Incrémenter le compteur de votes du participant
    incrementParticipantVoteCount(meetingId, currentUserName);

    // Sauvegarder localement
    votes[voteIndex] = vote;
    meetingVotes.set(meetingId, votes);

    try {
        const response = await fetch(`${API_BASE_URL}/api/votes/${voteId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userName: currentUserName,
                selectedOptions: selectedOptions
            })
        });

        if (response.ok) {
            const updatedVote = await response.json();
            votes[voteIndex] = updatedVote;
            meetingVotes.set(meetingId, votes);
        }
        
    } catch (error) {
        console.log('Mode local: vote soumis localement');
    }

    // Recharger l'affichage
    loadMeetingVotes();
    showNotification('Vote enregistré avec succès!');
}

// Annuler un vote
async function cancelVote(voteId) {
    if (!currentMeeting || !currentUserName) {
        showError('Impossible d\'annuler le vote sans être identifié');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/votes/${voteId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userName: currentUserName
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        }

        // Recharger les votes depuis le serveur
        await loadMeetingVotes();
        showNotification('Vote annulé avec succès');
        
    } catch (error) {
        console.error('Erreur lors de l\'annulation du vote:', error);
        showError(error.message || 'Erreur lors de l\'annulation du vote');
    }
}

// Fermer un vote
async function closeVote(voteId) {
    if (!currentMeeting) {
        showError('Aucune réunion active');
        return;
    }

    // Mettre à jour localement d'abord
    const meetingId = currentMeeting.id;
    const votes = meetingVotes.get(meetingId) || [];
    const voteIndex = votes.findIndex(v => v.id === voteId);
    
    if (voteIndex === -1) {
        showError('Vote introuvable');
        return;
    }

    votes[voteIndex].status = 'closed';
    votes[voteIndex].closedAt = new Date().toISOString();
    meetingVotes.set(meetingId, votes);

    try {
        const response = await fetch(`${API_BASE_URL}/api/votes/${voteId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            console.log('Mode local: vote fermé localement');
        }
        
    } catch (error) {
        console.log('Mode local: vote fermé localement');
    }

    // Recharger l'affichage
    await loadMeetingVotes();
    showNotification('Vote fermé avec succès!');
}

// Générer un ID unique pour un vote
function generateVoteId() {
    return 'vote_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Initialiser le système de vote au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Attendre que les autres éléments soient initialisés
    setTimeout(initializeVoteSystem, 100);
    setTimeout(initializePastMeetings, 100);
});

// Variables globales pour les réunions passées
let meetingReportLink = null;
let meetingParticipants = [];

// Variables globales pour les statistiques des participants
let participantStats = new Map(); // Stockage des statistiques par réunion

// Initialiser les fonctionnalités des réunions passées
function initializePastMeetings() {
    // Gestionnaires d'événements pour les boutons
    const addReportLinkBtn = document.getElementById('addReportLinkBtn');
    const meetingReportBtn = document.getElementById('meetingReportBtn');
    const showParticipantsBtn = document.getElementById('showParticipantsBtn');
    const reportLinkForm = document.getElementById('reportLinkForm');
    const pastMeetingSelect = document.getElementById('pastMeetingSelect');
    const editReportBtn = document.getElementById('editReportBtn');
    const reportEditForm = document.getElementById('reportEditForm');

    if (addReportLinkBtn) {
        addReportLinkBtn.addEventListener('click', openReportLinkModal);
    }

    if (meetingReportBtn) {
        meetingReportBtn.addEventListener('click', openMeetingReport);
    }

    if (showParticipantsBtn) {
        showParticipantsBtn.addEventListener('click', openParticipantsModal);
    }

    if (reportLinkForm) {
        reportLinkForm.addEventListener('submit', handleReportLinkSubmit);
    }

    if (editReportBtn) {
        editReportBtn.addEventListener('click', openReportEditModal);
    }

    if (reportEditForm) {
        reportEditForm.addEventListener('submit', handleReportEditSubmit);
    }

    // Connecter l'événement de sélection de réunion passée
    if (pastMeetingSelect) {
        pastMeetingSelect.addEventListener('change', handlePastMeetingSelection);
    }

    // Charger les données sauvegardées
    loadPastMeetingData();
    updatePastMeetingsUI();
}

// Ouvrir la modale pour ajouter/modifier le lien du compte rendu
function openReportLinkModal() {
    const modal = document.getElementById('reportLinkModal');
    const input = document.getElementById('reportLinkInput');
    
    if (meetingReportLink) {
        input.value = meetingReportLink;
    }
    
    modal.style.display = 'block';
}

// Fermer la modale du lien du compte rendu
function closeReportLinkModal() {
    const modal = document.getElementById('reportLinkModal');
    modal.style.display = 'none';
    document.getElementById('reportLinkForm').reset();
}

// Gérer la soumission du formulaire de lien
async function handleReportLinkSubmit(e) {
    e.preventDefault();
    
    const input = document.getElementById('reportLinkInput');
    const link = input.value.trim();
    
    if (link) {
        meetingReportLink = link;
        await savePastMeetingData();
        updatePastMeetingsUI();
        closeReportLinkModal();
        showNotification('Lien du compte rendu sauvegardé!');
    }
}

// Ouvrir le compte rendu de réunion
function openMeetingReport() {
    if (meetingReportLink) {
        window.open(meetingReportLink, '_blank');
    }
}

// Ouvrir la modale des participants
function openParticipantsModal() {
    const modal = document.getElementById('participantsModal');
    const participantsList = document.getElementById('participantsList');
    
    if (meetingParticipants.length === 0) {
        participantsList.innerHTML = '<p class="no-participants">Aucun participant enregistré.</p>';
    } else {
        participantsList.innerHTML = meetingParticipants.map(participant => 
            `<div class="participant-item">
                <i class="fas fa-user"></i>
                <span>${participant}</span>
            </div>`
        ).join('');
    }
    
    modal.style.display = 'block';
}

// Fermer la modale des participants
function closeParticipantsModal() {
    const modal = document.getElementById('participantsModal');
    modal.style.display = 'none';
}

// Ajouter un participant à la liste
function addParticipant(userName) {
    if (userName && !meetingParticipants.includes(userName)) {
        meetingParticipants.push(userName);
        
        // Initialiser les statistiques du participant pour cette réunion
        if (currentMeeting && currentMeeting.id) {
            initializeParticipantStats(currentMeeting.id, userName);
        }
        
        savePastMeetingData();
    }
}

// Charger les données des réunions passées
async function loadPastMeetingData() {
    try {
        const data = localStorage.getItem('pastMeetingData');
        if (data) {
            const parsedData = JSON.parse(data);
            meetingReportLink = parsedData.reportLink || null;
            meetingParticipants = parsedData.participants || [];
        }
        
        // Charger aussi les statistiques des participants
        await loadParticipantStats();
    } catch (error) {
        console.error('Erreur lors du chargement des données des réunions passées:', error);
    }
}

// Initialiser les statistiques d'un participant pour une réunion
function initializeParticipantStats(meetingId, userName) {
    if (!participantStats.has(meetingId)) {
        participantStats.set(meetingId, new Map());
    }
    
    const meetingStats = participantStats.get(meetingId);
    if (!meetingStats.has(userName)) {
        meetingStats.set(userName, {
            connectionTime: Date.now(), // Timestamp de connexion
            totalConnectionDuration: 0, // Durée totale en millisecondes
            voteCount: 0, // Nombre de votes effectués
            isConnected: true // État de connexion actuel
        });
        
        // Sauvegarder les statistiques
        saveParticipantStats();
    }
}

// Calculer le temps de connexion d'un participant
function updateParticipantConnectionTime(meetingId, userName) {
    if (!participantStats.has(meetingId)) return;
    
    const meetingStats = participantStats.get(meetingId);
    const userStats = meetingStats.get(userName);
    
    if (userStats && userStats.isConnected) {
        const currentTime = Date.now();
        const sessionDuration = currentTime - userStats.connectionTime;
        userStats.totalConnectionDuration += sessionDuration;
        userStats.connectionTime = currentTime; // Reset pour la prochaine session
        
        saveParticipantStats();
    }
}

// Incrémenter le compteur de votes d'un participant
function incrementParticipantVoteCount(meetingId, userName) {
    if (!participantStats.has(meetingId)) {
        participantStats.set(meetingId, new Map());
    }
    
    const meetingStats = participantStats.get(meetingId);
    if (!meetingStats.has(userName)) {
        initializeParticipantStats(meetingId, userName);
    }
    
    const userStats = meetingStats.get(userName);
    if (userStats) {
        userStats.voteCount++;
        saveParticipantStats();
    }
}

// Formater la durée en format lisible
function formatDuration(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}min ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}min ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

// Sauvegarder les statistiques des participants
async function saveParticipantStats() {
    try {
        const statsObject = {};
        
        participantStats.forEach((meetingStats, meetingId) => {
            statsObject[meetingId] = {};
            meetingStats.forEach((userStats, userName) => {
                statsObject[meetingId][userName] = {
                    totalConnectionDuration: userStats.totalConnectionDuration,
                    voteCount: userStats.voteCount,
                    lastConnectionTime: userStats.connectionTime,
                    isConnected: userStats.isConnected
                };
            });
        });
        
        // Sauvegarder dans le fichier JSON via une requête au serveur
        const response = await fetch(`${API_BASE_URL}/api/participant-stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(statsObject)
        });
        
        if (!response.ok) {
            console.log('Mode local: sauvegarde des statistiques en localStorage');
            localStorage.setItem('participantStats', JSON.stringify(statsObject));
        }
    } catch (error) {
        console.log('Mode local: sauvegarde des statistiques en localStorage');
        const statsObject = {};
        participantStats.forEach((meetingStats, meetingId) => {
            statsObject[meetingId] = {};
            meetingStats.forEach((userStats, userName) => {
                statsObject[meetingId][userName] = {
                    totalConnectionDuration: userStats.totalConnectionDuration,
                    voteCount: userStats.voteCount,
                    lastConnectionTime: userStats.connectionTime,
                    isConnected: userStats.isConnected
                };
            });
        });
        localStorage.setItem('participantStats', JSON.stringify(statsObject));
    }
}

// Charger les statistiques des participants
async function loadParticipantStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/participant-stats`);
        if (response.ok) {
            const statsObject = await response.json();
            participantStats.clear();
            
            Object.entries(statsObject).forEach(([meetingId, meetingData]) => {
                const meetingStats = new Map();
                Object.entries(meetingData).forEach(([userName, userStats]) => {
                    meetingStats.set(userName, {
                        connectionTime: userStats.lastConnectionTime || Date.now(),
                        totalConnectionDuration: userStats.totalConnectionDuration || 0,
                        voteCount: userStats.voteCount || 0,
                        isConnected: userStats.isConnected || false
                    });
                });
                participantStats.set(meetingId, meetingStats);
            });
        } else {
            throw new Error('Fichier non disponible');
        }
    } catch (error) {
        console.log('Mode local: chargement des statistiques depuis localStorage');
        const data = localStorage.getItem('participantStats');
        if (data) {
            const statsObject = JSON.parse(data);
            participantStats.clear();
            
            Object.entries(statsObject).forEach(([meetingId, meetingData]) => {
                const meetingStats = new Map();
                Object.entries(meetingData).forEach(([userName, userStats]) => {
                    meetingStats.set(userName, {
                        connectionTime: userStats.lastConnectionTime || Date.now(),
                        totalConnectionDuration: userStats.totalConnectionDuration || 0,
                        voteCount: userStats.voteCount || 0,
                        isConnected: userStats.isConnected || false
                    });
                });
                participantStats.set(meetingId, meetingStats);
            });
        }
    }
}

// Sauvegarder les données des réunions passées
async function savePastMeetingData() {
    try {
        const data = {
            reportLink: meetingReportLink,
            participants: meetingParticipants
        };
        localStorage.setItem('pastMeetingData', JSON.stringify(data));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des données des réunions passées:', error);
    }
}

// Mettre à jour l'interface des réunions passées
function updatePastMeetingsUI() {
    const pastMeetingSelect = document.getElementById('pastMeetingSelect');
    const addReportLinkBtn = document.getElementById('addReportLinkBtn');
    const meetingReportBtn = document.getElementById('meetingReportBtn');
    const editReportBtn = document.getElementById('editReportBtn');
    const deletePastMeetingBtn = document.getElementById('deletePastMeetingBtn');
    
    // Charger les réunions passées dans le sélecteur
    if (pastMeetingSelect) {
        loadPastMeetingsSelector();
    }
    
    // Afficher/masquer les boutons selon le mode admin et la présence du lien
    if (isAdminMode) {
        if (addReportLinkBtn) addReportLinkBtn.style.display = 'inline-block';
        if (editReportBtn) editReportBtn.style.display = 'inline-block';
        // Le bouton supprimer n'apparaît que si une réunion est sélectionnée
        if (deletePastMeetingBtn && pastMeetingSelect && pastMeetingSelect.value) {
            deletePastMeetingBtn.style.display = 'inline-block';
        } else if (deletePastMeetingBtn) {
            deletePastMeetingBtn.style.display = 'none';
        }
    } else {
        if (addReportLinkBtn) addReportLinkBtn.style.display = 'none';
        if (editReportBtn) editReportBtn.style.display = 'none';
        if (deletePastMeetingBtn) deletePastMeetingBtn.style.display = 'none';
    }
    
    if (meetingReportLink && meetingReportBtn) {
        meetingReportBtn.style.display = 'inline-block';
    } else if (meetingReportBtn) {
        meetingReportBtn.style.display = 'none';
    }
}

// Charger les réunions passées dans le sélecteur
async function loadPastMeetingsSelector() {
    const pastMeetingSelect = document.getElementById('pastMeetingSelect');
    if (!pastMeetingSelect) return;
    
    try {
        const pastMeetings = await getPastMeetings();
        
        // Vider le sélecteur
        pastMeetingSelect.innerHTML = '<option value="">Sélectionner une réunion...</option>';
        
        if (pastMeetings && pastMeetings.length > 0) {
            pastMeetings.forEach(meeting => {
                const option = document.createElement('option');
                option.value = meeting.id;
                option.textContent = `${meeting.name} - ${new Date(meeting.endedAt).toLocaleDateString()}`;
                pastMeetingSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erreur lors du chargement des réunions passées:', error);
    }
}

// Gérer le changement de sélection de réunion passée
function handlePastMeetingSelection() {
    const pastMeetingSelect = document.getElementById('pastMeetingSelect');
    const selectedMeetingId = pastMeetingSelect.value;
    const deletePastMeetingBtn = document.getElementById('deletePastMeetingBtn');
    
    if (selectedMeetingId) {
        loadSelectedPastMeeting(selectedMeetingId);
        // Afficher le bouton supprimer si admin et réunion sélectionnée
        if (deletePastMeetingBtn && isAdminMode) {
            deletePastMeetingBtn.style.display = 'inline-block';
        }
    } else {
        clearPastMeetingDisplay();
        // Masquer le bouton supprimer si aucune réunion sélectionnée
        if (deletePastMeetingBtn) {
            deletePastMeetingBtn.style.display = 'none';
        }
    }
}

// Charger les données d'une réunion passée sélectionnée
async function loadSelectedPastMeeting(meetingId) {
    try {
        const pastMeetings = await getPastMeetings();
        const selectedMeeting = pastMeetings.find(meeting => meeting.id === meetingId);
        
        if (selectedMeeting) {
            // Récupérer les votes depuis le backend
            try {
                const response = await fetch(`${API_BASE_URL}/api/votes?meetingId=${meetingId}`);
                if (response.ok) {
                    const votes = await response.json();
                    selectedMeeting.votes = votes;
                }
            } catch (error) {
                console.log('Utilisation des votes du localStorage pour la réunion passée');
            }
            
            // Récupérer le compte-rendu depuis le backend
            try {
                const reportResponse = await fetch(`${API_BASE_URL}/api/reports/${meetingId}`);
                if (reportResponse.ok) {
                    const reportData = await reportResponse.json();
                    selectedMeeting.reportLink = reportData.reportUrl;
                }
            } catch (error) {
                console.log('Aucun compte-rendu trouvé sur le serveur pour cette réunion');
            }
            
            displayPastMeetingData(selectedMeeting);
        }
    } catch (error) {
        console.error('Erreur lors du chargement de la réunion passée:', error);
    }
}

// Afficher les données d'une réunion passée
function displayPastMeetingData(meeting) {
    // Afficher le contenu des réunions passées
    const pastMeetingsContent = document.getElementById('pastMeetingsContent');
    if (pastMeetingsContent) {
        pastMeetingsContent.style.display = 'block';
    }

    // Stocker l'ID de la réunion sélectionnée pour l'édition
    window.selectedPastMeetingId = meeting.id;

    // Afficher le compte rendu
    const reportBtn = document.getElementById('pastMeetingReportBtn');
    const editReportBtn = document.getElementById('editReportBtn');
    const noReportMessage = document.getElementById('noReportMessage');
    
    if (meeting.reportLink) {
        if (reportBtn) {
            reportBtn.style.display = 'inline-block';
            reportBtn.onclick = () => window.open(meeting.reportLink, '_blank');
        }
        if (noReportMessage) {
            noReportMessage.style.display = 'none';
        }
    } else {
        if (reportBtn) {
            reportBtn.style.display = 'none';
        }
        if (noReportMessage) {
            noReportMessage.style.display = 'block';
        }
    }
    
    // Afficher le bouton d'édition pour les administrateurs
    if (editReportBtn) {
        if (isAdminMode) {
            editReportBtn.style.display = 'inline-block';
        } else {
            editReportBtn.style.display = 'none';
        }
    }
    
    // Afficher l'historique des votes
    const voteHistoryContent = document.getElementById('pastMeetingVoteHistory');
    
    if (voteHistoryContent) {
        if (meeting.votes && meeting.votes.length > 0) {
            voteHistoryContent.innerHTML = meeting.votes.map(vote => createVoteItemHTML(vote, true)).join('');
        } else {
            voteHistoryContent.innerHTML = '<p class="no-votes">Aucun vote dans l\'historique de cette réunion.</p>';
        }
    }
    
    // Afficher les participants
    const participantsContent = document.getElementById('pastMeetingParticipants');
    
    if (participantsContent) {
        if (meeting.participants && meeting.participants.length > 0) {
            // Récupérer les statistiques pour cette réunion
            const meetingStats = participantStats.get(meeting.id) || new Map();
            
            participantsContent.innerHTML = `
                <div class="participants-table-container">
                    <table class="participants-table">
                        <thead>
                            <tr>
                                <th><i class="fas fa-user"></i> Nom</th>
                                <th><i class="fas fa-clock"></i> Temps</th>
                                <th><i class="fas fa-vote-yea"></i> Votes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${meeting.participants.map(participant => {
                                const stats = meetingStats.get(participant) || { totalConnectionDuration: 0, voteCount: 0 };
                                const connectionTime = formatDuration(stats.totalConnectionDuration);
                                
                                return `
                                    <tr>
                                        <td class="participant-name">${participant}</td>
                                        <td class="participant-time">${connectionTime}</td>
                                        <td class="participant-votes">${stats.voteCount}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            participantsContent.innerHTML = '<div class="no-participants">Aucun participant enregistré pour cette réunion.</div>';
        }
    }
}

// Effacer l'affichage des réunions passées
function clearPastMeetingDisplay() {
    // Masquer le contenu des réunions passées
    const pastMeetingsContent = document.getElementById('pastMeetingsContent');
    if (pastMeetingsContent) {
        pastMeetingsContent.style.display = 'none';
    }

    const reportBtn = document.getElementById('pastMeetingReportBtn');
    const editReportBtn = document.getElementById('editReportBtn');
    const noReportMessage = document.getElementById('noReportMessage');
    
    if (reportBtn) {
        reportBtn.style.display = 'none';
    }
    
    if (editReportBtn) {
        editReportBtn.style.display = 'none';
    }
    
    if (noReportMessage) {
        noReportMessage.style.display = 'none';
    }

    // Effacer l'historique des votes
    const voteHistoryContent = document.getElementById('pastMeetingVoteHistory');
    if (voteHistoryContent) {
        voteHistoryContent.innerHTML = '<p class="no-votes">Aucun vote dans l\'historique.</p>';
    }

    // Effacer les participants
    const participantsContent = document.getElementById('pastMeetingParticipants');
    if (participantsContent) {
        participantsContent.innerHTML = '<p class="no-participants">Aucun participant enregistré.</p>';
    }
    
    // Effacer l'ID de la réunion sélectionnée
    window.selectedPastMeetingId = null;
}

// Ouvrir la modal d'édition du compte-rendu
function openReportEditModal() {
    const modal = document.getElementById('reportEditModal');
    const input = document.getElementById('reportEditInput');
    
    if (modal && input) {
        // Pré-remplir avec le lien existant s'il y en a un
        const reportBtn = document.getElementById('pastMeetingReportBtn');
        if (reportBtn && reportBtn.style.display !== 'none') {
            // Récupérer le lien depuis le bouton existant
            const currentLink = reportBtn.onclick ? reportBtn.onclick.toString().match(/window\.open\(['"]([^'"]+)['"]/)?.[1] : '';
            input.value = currentLink || '';
        } else {
            input.value = '';
        }
        
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

// Fermer la modal d'édition du compte-rendu
function closeReportEditModal() {
    const modal = document.getElementById('reportEditModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

// Gérer la soumission du formulaire d'édition du compte-rendu
async function handleReportEditSubmit(e) {
    e.preventDefault();
    
    const reportUrl = document.getElementById('reportEditInput').value.trim();
    const meetingId = window.selectedPastMeetingId;
    
    if (!meetingId) {
        showError('Aucune réunion sélectionnée');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/reports/${meetingId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reportUrl })
        });
        
        if (response.ok) {
            showNotification('Lien du compte-rendu mis à jour avec succès');
            closeReportEditModal();
            
            // Recharger les données de la réunion pour mettre à jour l'affichage
            await loadSelectedPastMeeting(meetingId);
        } else {
            throw new Error('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du compte-rendu:', error);
        showError('Erreur lors de la mise à jour du compte-rendu');
    }
}

// Effacer l'affichage des réunions passées
function clearPastMeetingDisplay() {
    const reportBtn = document.getElementById('meetingReportBtn');
    const noReportMessage = document.getElementById('noReportMessage');
    const editReportBtn = document.getElementById('editReportBtn');
    const voteHistoryContent = document.getElementById('pastMeetingVoteHistory');
    const participantsContent = document.getElementById('pastMeetingParticipants');
    
    if (reportBtn) {
        reportBtn.style.display = 'none';
    }
    
    if (editReportBtn) {
        editReportBtn.style.display = 'none';
    }
    
    if (noReportMessage) {
        noReportMessage.style.display = 'none';
    }
    
    if (voteHistoryContent) {
        voteHistoryContent.innerHTML = '<p class="no-votes">Sélectionnez une réunion pour voir son historique de votes.</p>';
    }
    
    if (participantsContent) {
        participantsContent.innerHTML = '<div class="no-participants">Sélectionnez une réunion pour voir ses participants.</div>';
    }
}

// Fonction pour finir la réunion (nouvelle fonction)
async function endMeeting() {
    if (!currentMeeting || !isAdminMode) {
        return;
    }
    
    // Confirmation avant de finir la réunion
    if (!confirm('Êtes-vous sûr de vouloir finir cette réunion ? Cette action créera une réunion passée avec toutes les données actuelles.')) {
        return;
    }
    
    try {
        // Récupérer toutes les données de la réunion actuelle
        const meetingData = {
            id: currentMeeting.id,
            name: currentMeeting.name,
            endedAt: new Date().toISOString(),
            reportLink: meetingReportLink,
            participants: [...meetingParticipants],
            votes: []
        };
        
        // Récupérer l'historique des votes depuis le serveur backend
        try {
            const response = await fetch(`${API_BASE_URL}/api/votes?meetingId=${currentMeeting.id}`);
            if (response.ok) {
                const votes = await response.json();
                meetingData.votes = votes;
            } else {
                console.log('Erreur lors de la récupération des votes depuis le serveur');
                // Fallback vers localStorage si le serveur n'est pas disponible
                const votesData = localStorage.getItem('votes');
                if (votesData) {
                    const allVotes = JSON.parse(votesData);
                    meetingData.votes = allVotes.filter(vote => vote.meetingId === currentMeeting.id);
                }
            }
        } catch (error) {
            console.log('Erreur de connexion au serveur, utilisation du cache local');
            // Fallback vers localStorage
            const votesData = localStorage.getItem('votes');
            if (votesData) {
                const allVotes = JSON.parse(votesData);
                meetingData.votes = allVotes.filter(vote => vote.meetingId === currentMeeting.id);
            }
        }
        
        // Sauvegarder la réunion passée
        await savePastMeeting(meetingData);
        
        // Supprimer la réunion du stockage des réunions actives
        await deleteMeetingFromStorage(currentMeeting.id);
        
        // Nettoyer les données temporaires
        meetingReportLink = null;
        meetingParticipants = [];
        
        // Afficher une notification de succès
        showNotification('Réunion terminée avec succès. Les données ont été sauvegardées dans les réunions passées.', 'success');
        
        // Retourner à l'accueil et actualiser l'affichage
        setTimeout(() => {
            resetToHome();
            // Actualiser l'affichage des réunions passées
            updatePastMeetingsUI();
            // Actualiser l'affichage des réunions actives
            displaySavedMeetings();
        }, 2000);
        
    } catch (error) {
        console.error('Erreur lors de la fin de réunion:', error);
        showNotification('Erreur lors de la sauvegarde de la réunion', 'error');
    }
}

// Fonction pour sauvegarder une réunion passée
async function savePastMeeting(meetingData) {
    try {
        // Sauvegarder sur le serveur
        const response = await fetch(`${API_BASE_URL}/api/past-meetings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(meetingData)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde sur le serveur');
        }
        
        console.log('Réunion passée sauvegardée sur le serveur:', meetingData);
        
        // Fallback: sauvegarder aussi dans localStorage
        let pastMeetings = [];
        const stored = localStorage.getItem('pastMeetings');
        if (stored) {
            pastMeetings = JSON.parse(stored);
        }
        pastMeetings.push(meetingData);
        localStorage.setItem('pastMeetings', JSON.stringify(pastMeetings));
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la réunion passée:', error);
        // En cas d'erreur serveur, sauvegarder quand même en local
        let pastMeetings = [];
        const stored = localStorage.getItem('pastMeetings');
        if (stored) {
            pastMeetings = JSON.parse(stored);
        }
        pastMeetings.push(meetingData);
        localStorage.setItem('pastMeetings', JSON.stringify(pastMeetings));
    }
}

// ===== GESTION DU HEADER STICKY =====
let lastScrollTop = 0;
let headerVisible = true;

function initializeHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        // Si on scroll vers le bas et qu'on a dépassé la hauteur du header
        if (currentScroll > lastScrollTop && currentScroll > 100) {
            // Masquer le header
            if (headerVisible) {
                header.classList.add('hidden');
                headerVisible = false;
            }
        } 
        // Si on scroll vers le haut
        else if (currentScroll < lastScrollTop) {
            // Afficher le header
            if (!headerVisible) {
                header.classList.remove('hidden');
                headerVisible = true;
            }
        }
        
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // Pour mobile ou scroll négatif
    }, { passive: true });
}

// Initialiser le header scroll au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeHeaderScroll();
});

// Fonction pour récupérer toutes les réunions passées
async function getPastMeetings() {
    try {
        // Récupérer depuis le serveur
        const response = await fetch(`${API_BASE_URL}/api/past-meetings`);
        
        if (response.ok) {
            const serverMeetings = await response.json();
            console.log('Réunions passées chargées depuis le serveur:', serverMeetings.length);
            
            // Synchroniser avec localStorage
            localStorage.setItem('pastMeetings', JSON.stringify(serverMeetings));
            
            return serverMeetings;
        } else {
            throw new Error('Erreur serveur');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des réunions passées depuis le serveur:', error);
        // Fallback vers localStorage
        const stored = localStorage.getItem('pastMeetings');
        return stored ? JSON.parse(stored) : [];
    }
}

// Fonction pour supprimer une réunion passée (admin uniquement)
async function deletePastMeeting() {
    if (!isAdminMode) {
        showError('Cette action nécessite les droits administrateur');
        return;
    }
    
    const pastMeetingSelect = document.getElementById('pastMeetingSelect');
    const meetingId = pastMeetingSelect?.value;
    
    if (!meetingId) {
        showError('Veuillez sélectionner une réunion à supprimer');
        return;
    }
    
    // Demander confirmation
    const meetingName = pastMeetingSelect.options[pastMeetingSelect.selectedIndex].text;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la réunion "${meetingName}" et toutes ses données associées (votes, statistiques, compte-rendu) ?\n\nCette action est irréversible.`)) {
        return;
    }
    
    try {
        // Supprimer via l'API
        const response = await fetch(`${API_BASE_URL}/api/past-meetings/${meetingId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }
        
        showNotification('Réunion et données associées supprimées avec succès', 'success');
        
        // Recharger la liste des réunions passées
        await loadPastMeetingsSelector();
        
        // Effacer l'affichage
        clearPastMeetingDisplay();
        
        // Masquer le contenu
        const pastMeetingsContent = document.getElementById('pastMeetingsContent');
        if (pastMeetingsContent) {
            pastMeetingsContent.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Erreur lors de la suppression de la réunion:', error);
        showError('Erreur lors de la suppression de la réunion');
    }
}