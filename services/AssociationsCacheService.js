import { associationsData } from '../data/AssociationsData';

// Stockage global pour les associations mises en cache
let cachedAssociations = null;
let lastCacheTime = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes en millisecondes

// Service pour gérer le cache des associations
const AssociationsCacheService = {
  // Récupérer les associations depuis le cache ou charger si nécessaire
  getAssociations: async (forceRefresh = false) => {
    // Si le cache existe et est encore valide, retourner depuis le cache sauf si forceRefresh est true
    if (!forceRefresh && cachedAssociations && lastCacheTime && (Date.now() - lastCacheTime < CACHE_DURATION)) {
      return cachedAssociations;
    }
    
    // Sinon charger les associations
    return new Promise((resolve) => {
      setTimeout(() => {
        const allAssociations = [];
        
        Object.values(associationsData).forEach(categoryAssociations => {
          categoryAssociations.forEach(association => {
            // Ajouter un logoPlaceholder si absent
            if (!association.logoPlaceholder) {
              // Utiliser soit l'icône spécifique à la catégorie, soit la première lettre
              const icons = {
                'Cancer': '🎗️',
                'Handicap': '♿',
                'Alzheimer': '🧠',
                'VIH/Sida': '🎗️',
                'Maladies rares': '🔬',
                'Santé mentale': '🧠',
                'Addictions': '💊',
                'Maladies chroniques': '❤️',
                'Accompagnement': '🤝',
              };
              
              // Chercher une icône correspondant à une catégorie
              let foundIcon = null;
              for (const cat of association.categories || []) {
                if (icons[cat]) {
                  foundIcon = icons[cat];
                  break;
                }
              }
              
              association.logoPlaceholder = foundIcon || association.name.charAt(0);
            }
            
            // Pré-calculer la catégorie principale et les couleurs pour l'association
            association.mainCategory = AssociationsCacheService.getMainCategoryForAssociation(association);
            association.mainColor = AssociationsCacheService.getCategoryColor(association.mainCategory);
            association.headerColor = AssociationsCacheService.getCategoryHeaderColor(association.mainCategory);
            
            allAssociations.push(association);
          });
        });
        
        // Mettre à jour le cache
        cachedAssociations = allAssociations;
        lastCacheTime = Date.now();
        
        resolve(allAssociations);
      }, 0);
    });
  },
  
  // Invalider le cache
  invalidateCache: () => {
    cachedAssociations = null;
    lastCacheTime = null;
  },
  
  // Obtenir la catégorie principale d'une association
  getMainCategoryForAssociation: (item) => {
    // Parcourir les catégories dans l'ordre défini pour trouver la catégorie principale
    const categoryOrder = [
      'Populaires',
      'Handicap',
      'Maladies chroniques',
      'Cancer',
      'Santé mentale',
      'Maladies rares',
      'Addictions',
      'Santé publique',
      'Accompagnement',
      'Maladies inflammatoires',
      'Défense des droits',
      'Maladies spécifiques',
      'Associations de patients',
      'Soutien et entraide',
      'Autres organisations',
      'Recherche et soutien'
    ];
    
    // Chercher à quelle catégorie principale appartient cette association
    for (const category of categoryOrder) {
      if (associationsData[category] && associationsData[category].some(a => a.id === item.id)) {
        return category;
      }
    }
    
    // Si aucune catégorie principale n'est trouvée, utiliser la première catégorie de l'association
    return item.categories && item.categories.length > 0 ? item.categories[0] : null;
  },
  
  // Obtenir la couleur pour une catégorie
  getCategoryColor: (category) => {
    // Couleurs spécifiques pour chaque catégorie
    const categoryColors = {
      'Populaires': '#4B7BEC',        // Bleu
      'Handicap': '#2ECC71',          // Vert
      'Maladies chroniques': '#9B59B6', // Violet
      'Cancer': '#E74C3C',             // Rouge
      'Santé mentale': '#3498DB',     // Bleu ciel
      'Maladies rares': '#F1C40F',    // Jaune
      'Addictions': '#E67E22',        // Orange
      'Santé publique': '#1ABC9C',    // Turquoise
      'Accompagnement': '#8E44AD',    // Violet foncé
      'Maladies inflammatoires': '#E74C3C',  // Rouge
      'Défense des droits': '#34495E',  // Bleu marine
      'Maladies spécifiques': '#16A085', // Vert foncé
      'Associations de patients': '#2980B9', // Bleu
      'Soutien et entraide': '#D35400', // Orange foncé
      'Autres organisations': '#95A5A6', // Gris
      'Recherche et soutien': '#C0392B'  // Rouge foncé
    };
    
    return categoryColors[category] || '#7F8C8D';
  },
  
  // Obtenir la couleur d'en-tête pour une catégorie
  getCategoryHeaderColor: (category) => {
    // Couleurs spécifiques pour chaque catégorie
    const categoryColors = {
      'Populaires': 'rgba(75, 123, 236, 0.15)',        // Bleu
      'Handicap': 'rgba(46, 204, 113, 0.15)',          // Vert
      'Maladies chroniques': 'rgba(155, 89, 182, 0.15)', // Violet
      'Cancer': 'rgba(231, 76, 60, 0.15)',             // Rouge
      'Santé mentale': 'rgba(52, 152, 219, 0.15)',     // Bleu ciel
      'Maladies rares': 'rgba(241, 196, 15, 0.15)',    // Jaune
      'Addictions': 'rgba(230, 126, 34, 0.15)',        // Orange
      'Santé publique': 'rgba(26, 188, 156, 0.15)',    // Turquoise
      'Accompagnement': 'rgba(142, 68, 173, 0.15)',    // Violet foncé
      'Maladies inflammatoires': 'rgba(231, 76, 60, 0.15)',  // Rouge
      'Défense des droits': 'rgba(52, 73, 94, 0.15)',  // Bleu marine
      'Maladies spécifiques': 'rgba(22, 160, 133, 0.15)', // Vert foncé
      'Associations de patients': 'rgba(41, 128, 185, 0.15)', // Bleu
      'Soutien et entraide': 'rgba(211, 84, 0, 0.15)', // Orange foncé
      'Autres organisations': 'rgba(149, 165, 166, 0.15)', // Gris
      'Recherche et soutien': 'rgba(192, 57, 43, 0.15)'  // Rouge foncé
    };
    
    return categoryColors[category] || 'rgba(120, 120, 120, 0.15)';
  },
  
  // Filtrer les associations selon des critères
  filterAssociations: (associations, searchQuery, selectedCategory) => {
    if (!associations) return [];
    
    // Si pas de filtrage, retourne toutes les associations ou uniquement celles de la catégorie
    if (!searchQuery || searchQuery.trim() === '') {
      if (selectedCategory === 'Toutes') {
        return associations;
      } else {
        return associations.filter(asso => 
          associationsData[selectedCategory] && 
          associationsData[selectedCategory].some(a => a.id === asso.id)
        );
      }
    }
    
    // Cas où il y a une recherche
    const lowerQuery = searchQuery.toLowerCase();
    
    return associations.filter(asso => {
      const matchesSearch = 
        asso.name.toLowerCase().includes(lowerQuery) || 
        asso.description.toLowerCase().includes(lowerQuery) ||
        (asso.categories && asso.categories.some(cat => cat.toLowerCase().includes(lowerQuery)));
      
      // Si "Toutes" est sélectionné, ne pas filtrer par catégorie
      if (selectedCategory === 'Toutes') {
        return matchesSearch;
      }
      
      // Sinon, vérifier si cette association appartient à la catégorie sélectionnée
      const belongsToCategory = associationsData[selectedCategory] && 
                               associationsData[selectedCategory].some(a => a.id === asso.id);
      
      return matchesSearch && belongsToCategory;
    });
  }
};

export default AssociationsCacheService; 