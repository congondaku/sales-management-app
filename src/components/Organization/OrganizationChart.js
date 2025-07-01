import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Crown, 
  Shield, 
  User, 
  Target,
  Mail,
  MapPin,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Eye,
  Edit,
  UserPlus,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { promotionService } from '../../services/promotion.service';
import { hasPermission } from '../../utils/permissions';
import { formatFullName } from '../../utils/formatters';
import { SectionSpinner } from '../Commons/LoadingSpinner';
import PromoteSalesPersonModal from './PromoteSalesPersonModal';
import PromoteAdminModal from './PromoteAdminModal';
import DemoteAdminModal from './DemoteAdminModal';

const OrganizationChart = () => {
  const { user } = useAuth();
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showPromoteSalesModal, setShowPromoteSalesModal] = useState(false);
  const [showPromoteAdminModal, setShowPromoteAdminModal] = useState(false);
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadOrganizationData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchPeople();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await promotionService.getOrganizationHierarchy();
      
      if (response.success) {
        setHierarchy(response.hierarchy || []);
        setStats(response.stats || {});
        
        // Auto-expand first level
        const firstLevelIds = (response.hierarchy || []).map(node => node.id);
        setExpandedNodes(new Set(firstLevelIds));
      } else {
        setError(response.message || 'Erreur lors du chargement de l\'organigramme');
      }
    } catch (error) {
      console.error('Error loading organization:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const searchPeople = async () => {
    try {
      const response = await promotionService.searchPeople(searchQuery);
      if (response.success) {
        setSearchResults(response.results || []);
      }
    } catch (error) {
      console.error('Error searching people:', error);
    }
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handlePromoteSalesPerson = (person) => {
    setSelectedPerson(person);
    setShowPromoteSalesModal(true);
  };

  const handlePromoteAdmin = (person) => {
    setSelectedPerson(person);
    setShowPromoteAdminModal(true);
  };

  const handleDemoteAdmin = (person) => {
    setSelectedPerson(person);
    setShowDemoteModal(true);
  };

  const handlePromotionSuccess = () => {
    loadOrganizationData();
    setShowPromoteSalesModal(false);
    setShowPromoteAdminModal(false);
    setShowDemoteModal(false);
    setSelectedPerson(null);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ceo':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'regional_manager':
      case 'sales_manager':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'team_leader':
        return <Target className="w-4 h-4 text-green-500" />;
      case 'Sales Person':
        return <User className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role) => {
    const colors = promotionService.getRoleColor(role);
    return colors;
  };

  const getPromotionActions = (person) => {
    const actions = [];
    
    if (person.type === 'SalesPerson') {
      const eligibility = promotionService.getPromotionEligibility(person, user?.role);
      if (eligibility.eligible && hasPermission(user, 'canCreateAdmins')) {
        actions.push({
          label: 'Promouvoir vers Admin',
          icon: TrendingUp,
          onClick: () => handlePromoteSalesPerson(person),
          className: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
        });
      }
    } else if (person.type === 'Admin') {
      // Promotion options
      const promotionOptions = promotionService.getPromotionOptions(person.role, user?.role);
      if (promotionOptions.length > 0 && hasPermission(user, 'canEditAdmins')) {
        actions.push({
          label: 'Promouvoir',
          icon: TrendingUp,
          onClick: () => handlePromoteAdmin(person),
          className: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
        });
      }

      // Demotion options
      const demotionOptions = promotionService.getDemotionOptions(person.role);
      if (demotionOptions.length > 0 && hasPermission(user, 'canEditAdmins') && person.id !== user?.id) {
        actions.push({
          label: 'Rétrograder',
          icon: TrendingDown,
          onClick: () => handleDemoteAdmin(person),
          className: 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
        });
      }
    }

    return actions;
  };

  const HierarchyNode = ({ node, level = 0 }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const promotionActions = getPromotionActions(node);

    return (
      <div className={`ml-${level * 6}`}>
        <div className={`
          p-4 mb-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md
          ${getRoleColor(node.role)}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {hasChildren ? (
                <button
                  onClick={() => toggleNode(node.id)}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}
              
              {getRoleIcon(node.role)}
              
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {node.name}
                  </h3>
                  {node.salesId && (
                    <span className="text-xs bg-white/70 px-2 py-1 rounded">
                      {node.salesId}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {promotionService.getRoleDisplayName(node.role)}
                </p>
                {node.territory && (
                  <div className="flex items-center space-x-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs">{node.territory}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Direct Reports Count */}
              {node.directReportsCount > 0 && (
                <div className="flex items-center space-x-1 bg-white/50 px-2 py-1 rounded text-xs">
                  <Users className="w-3 h-3" />
                  <span>{node.directReportsCount}</span>
                </div>
              )}

              {/* Manager Info */}
              {node.manager && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Manager: {node.manager.name}
                </div>
              )}

              {/* Promotion Actions */}
              {promotionActions.length > 0 && (
                <div className="relative group">
                  <button className="p-1 hover:bg-white/50 rounded">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 hidden group-hover:block">
                    <div className="py-1">
                      {promotionActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.onClick}
                          className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 ${action.className}`}
                        >
                          <action.icon className="w-4 h-4" />
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Actions */}
              <div className="flex space-x-1">
                <a
                  href={`mailto:${node.email}`}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                  title="Envoyer un email"
                >
                  <Mail className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setSelectedPerson(node)}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                  title="Voir détails"
                >
                  <Eye className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {node.children.map(child => (
              <HierarchyNode 
                key={child.id} 
                node={child} 
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const SearchResults = () => {
    if (searchResults.length === 0) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg max-h-96 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Résultats de recherche ({searchResults.length})
          </h3>
        </div>
        <div className="p-2">
          {searchResults.map(person => (
            <div
              key={person.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
              onClick={() => setSelectedPerson(person)}
            >
              <div className="flex items-center space-x-3">
                {getRoleIcon(person.role)}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {person.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {promotionService.getRoleDisplayName(person.role)}
                  </p>
                  {person.manager && (
                    <p className="text-xs text-gray-500">
                      Manager: {person.manager.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {person.territory && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                    {person.territory}
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded ${getRoleColor(person.role)}`}>
                  {person.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <SectionSpinner text="Chargement de l'organigramme..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadOrganizationData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Organigramme
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Structure hiérarchique et gestion des promotions
          </p>
        </div>
        
        <button
          onClick={loadOrganizationData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalAdmins || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Administrateurs
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <UserPlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalSalesPeople || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Commerciaux
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalPeople || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Personnel
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher une personne dans l'organisation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-10">
            <SearchResults />
          </div>
        )}
      </div>

      {/* Hierarchy Tree */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Structure Hiérarchique
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>Cliquez sur les flèches pour développer</span>
          </div>
        </div>

        {hierarchy.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Aucune donnée hiérarchique disponible
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {hierarchy.map(node => (
              <HierarchyNode key={node.id} node={node} level={0} />
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Légende des Rôles
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { role: 'ceo', label: 'PDG' },
            { role: 'regional_manager', label: 'Directeur Régional' },
            { role: 'sales_manager', label: 'Directeur des Ventes' },
            { role: 'team_leader', label: 'Chef d\'Équipe' },
            { role: 'admin', label: 'Administrateur' },
            { role: 'Sales Person', label: 'Commercial' }
          ].map(({ role, label }) => (
            <div key={role} className="flex items-center space-x-2">
              {getRoleIcon(role)}
              <span className={`text-xs px-2 py-1 rounded ${getRoleColor(role)}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showPromoteSalesModal && selectedPerson && (
        <PromoteSalesPersonModal
          salesPerson={selectedPerson}
          onClose={() => {
            setShowPromoteSalesModal(false);
            setSelectedPerson(null);
          }}
          onSuccess={handlePromotionSuccess}
        />
      )}

      {showPromoteAdminModal && selectedPerson && (
        <PromoteAdminModal
          admin={selectedPerson}
          onClose={() => {
            setShowPromoteAdminModal(false);
            setSelectedPerson(null);
          }}
          onSuccess={handlePromotionSuccess}
        />
      )}

      {showDemoteModal && selectedPerson && (
        <DemoteAdminModal
          admin={selectedPerson}
          onClose={() => {
            setShowDemoteModal(false);
            setSelectedPerson(null);
          }}
          onSuccess={handlePromotionSuccess}
        />
      )}

      {/* Person Details Modal */}
      {selectedPerson && !showPromoteSalesModal && !showPromoteAdminModal && !showDemoteModal && (
        <PersonDetailsModal
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          onPromote={() => {
            if (selectedPerson.type === 'SalesPerson') {
              setShowPromoteSalesModal(true);
            } else {
              setShowPromoteAdminModal(true);
            }
          }}
          onDemote={() => setShowDemoteModal(true)}
        />
      )}
    </div>
  );
};

// Person Details Modal Component
const PersonDetailsModal = ({ person, onClose, onPromote, onDemote }) => {
  const { user } = useAuth();
  const promotionActions = getPromotionActions(person);

  const getPromotionActions = (person) => {
    const actions = [];
    
    if (person.type === 'SalesPerson') {
      const eligibility = promotionService.getPromotionEligibility(person, user?.role);
      if (eligibility.eligible && hasPermission(user, 'canCreateAdmins')) {
        actions.push('promote');
      }
    } else if (person.type === 'Admin') {
      const promotionOptions = promotionService.getPromotionOptions(person.role, user?.role);
      if (promotionOptions.length > 0 && hasPermission(user, 'canEditAdmins')) {
        actions.push('promote');
      }

      const demotionOptions = promotionService.getDemotionOptions(person.role);
      if (demotionOptions.length > 0 && hasPermission(user, 'canEditAdmins') && person.id !== user?.id) {
        actions.push('demote');
      }
    }

    return actions;
  };

  const actions = getPromotionActions(person);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRoleColor(person.role)}`}>
                {getRoleIcon(person.role)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {person.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {promotionService.getRoleDisplayName(person.role)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <p className="text-sm text-gray-900 dark:text-white">{person.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <p className="text-sm text-gray-900 dark:text-white">{person.email}</p>
            </div>
            {person.territory && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Territoire</label>
                <p className="text-sm text-gray-900 dark:text-white">{person.territory}</p>
              </div>
            )}
            {person.salesId && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ID Commercial</label>
                <p className="text-sm text-gray-900 dark:text-white">{person.salesId}</p>
              </div>
            )}
          </div>

          {person.manager && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Manager</label>
              <p className="text-sm text-gray-900 dark:text-white">
                {person.manager.name} ({person.manager.role})
              </p>
            </div>
          )}

          {person.directReportsCount > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Équipe</label>
              <p className="text-sm text-gray-900 dark:text-white">
                {person.directReportsCount} personne{person.directReportsCount > 1 ? 's' : ''} sous sa responsabilité
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Fermer
          </button>
          
          <div className="flex space-x-2">
            {actions.includes('promote') && (
              <button
                onClick={onPromote}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Promouvoir</span>
              </button>
            )}
            
            {actions.includes('demote') && (
              <button
                onClick={onDemote}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
              >
                <TrendingDown className="w-4 h-4" />
                <span>Rétrograder</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationChart;
