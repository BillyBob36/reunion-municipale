// Script pour masquer la popup "Share the room" de MiroTalk
(function() {
    'use strict';
    
    // Fonction pour masquer les éléments de partage
    function hideShareElements() {
        const selectors = [
            // Sélecteurs pour la popup de partage
            '[id*="shareRoom"]',
            '[class*="shareRoom"]',
            '[class*="share-room"]',
            '[data-bs-target*="shareRoom"]',
            '.modal[id*="share"]',
            '.share-room-dialog',
            '.share-room-modal',
            '.qr-code-container',
            // Boutons de partage
            'button:contains("Share")',
            '.btn:contains("Share")',
            '[title*="Share"]',
            '[aria-label*="Share"]',
            // Éléments avec texte "Share the room"
            '*:contains("Share the room")',
            // Modals Bootstrap
            '.modal-dialog:has(.modal-title:contains("Share"))',
            '.modal-content:has(.modal-title:contains("Share"))'
        ];
        
        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.style.display = 'none';
                    element.style.visibility = 'hidden';
                    element.style.opacity = '0';
                    element.style.pointerEvents = 'none';
                    element.remove();
                });
            } catch (e) {
                // Ignorer les erreurs de sélecteur
            }
        });
        
        // Masquer spécifiquement les éléments avec le texte "Share the room"
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            if (element.textContent && element.textContent.includes('Share the room')) {
                const modal = element.closest('.modal, .dialog, .popup, [role="dialog"]');
                if (modal) {
                    modal.style.display = 'none';
                    modal.remove();
                }
            }
        });
    }
    
    // Observer pour détecter les changements dans le DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                hideShareElements();
            }
        });
    });
    
    // Démarrer l'observation
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Exécuter immédiatement
    hideShareElements();
    
    // Exécuter après le chargement complet
    document.addEventListener('DOMContentLoaded', hideShareElements);
    window.addEventListener('load', hideShareElements);
    
    // Exécuter périodiquement pour s'assurer que les éléments restent masqués
    setInterval(hideShareElements, 1000);
    
})();