import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, RefreshCw, MapPin, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import freeListingService from '../../services/freeListing.service';
import LoadingSpinner from '../Commons/LoadingSpinner';
import CreateFreeListingModal from './CreateFreeListingModal';
import ActivateFreeListingModal from './ActivateFreeListingModal';
import EditFreeListingModal from './EditFreeListingModal';
import FreeListingCard from './FreeListingCard';
import Toast from '../Commons/Toast';

// Debounce hook — waits for user to stop typing before firing search
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const FreeListingsPage = () => {
  const { user, isAdmin, isSalesPerson } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [administrativeDivisions, setAdministrativeDivisions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [toast, setToast] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Debounced search — waits 400ms after user stops typing
  const debouncedSearch = useDebounce(searchTerm, 400);

  // ── Fetch administrative divisions ──────────────────────────
  useEffect(() => {
    const fetchAdministrativeDivisions = async () => {
      setLoadingLocations(true);
      try {
        const response = await freeListingService.getAdministrativeDivisions();
        const divisions = response.data || response;
        setAdministrativeDivisions(Array.isArray(divisions) ? divisions : []);
      } catch (error) {
        showToast('Erreur lors du chargement des provinces', 'error');
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchAdministrativeDivisions();
  }, []);

  // ── Fetch listings — server-side search + filters ────────────
  const fetchListings = useCallback(async (resetPage = false) => {
    setLoading(true);
    const page = resetPage ? 1 : pagination.page;

    try {
      let response;

      if (filterStatus === 'unpaid') {
        response = await freeListingService.getUnpaidListings(page, pagination.limit);
        setListings(response.listings || []);
        setPagination(prev => ({
          ...prev,
          page,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0,
        }));
      } else {
        response = await freeListingService.getAllListings({
          page,
          limit: pagination.limit,
          status: filterStatus === 'active' ? 'available' : undefined,
          // ✅ Pass search and location filters to the backend
          search:   debouncedSearch || undefined,
          province: selectedProvince || undefined,
          ville:    selectedVille    || undefined,
          commune:  selectedCommune  || undefined,
        });
        setListings(response.listings || []);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            page,
            total: response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 0,
          }));
        }
      }
    } catch (error) {
      showToast('Erreur lors du chargement des annonces', 'error');
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filterStatus,
    debouncedSearch,
    selectedProvince,
    selectedVille,
    selectedCommune,
  ]);

  // Re-fetch when any filter or page changes
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Reset to page 1 whenever filters/search change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearch, filterStatus, selectedProvince, selectedVille, selectedCommune]);

  // ── Location helpers ─────────────────────────────────────────
  const getAvailableProvinces = () =>
    administrativeDivisions.filter(p => p.isActive);

  const getAvailableVilles = () => {
    if (!selectedProvince) return [];
    const province = administrativeDivisions.find(p => p.nom === selectedProvince);
    return province?.villes?.filter(v => v.isActive) || [];
  };

  const getAvailableCommunes = () => {
    if (!selectedProvince || !selectedVille) return [];
    const province = administrativeDivisions.find(p => p.nom === selectedProvince);
    const ville = province?.villes?.find(v => v.nom === selectedVille);
    return ville?.communes?.filter(c => c.isActive) || [];
  };

  const handleProvinceChange = (e) => {
    setSelectedProvince(e.target.value);
    setSelectedVille('');
    setSelectedCommune('');
  };

  const handleVilleChange = (e) => {
    setSelectedVille(e.target.value);
    setSelectedCommune('');
  };

  const clearLocationFilters = () => {
    setSelectedProvince('');
    setSelectedVille('');
    setSelectedCommune('');
  };

  // ── Toast ────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Handlers ─────────────────────────────────────────────────
  const handleListingCreated = () => {
    setShowCreateModal(false);
    fetchListings(true);
    showToast('Annonce créée et activée avec succès!', 'success');
  };

  const handleListingActivated = () => {
    setShowActivateModal(false);
    setSelectedListing(null);
    fetchListings(true);
    showToast('Annonce activée avec succès!', 'success');
  };

  const handleEditListing = (listing) => {
    setSelectedListing(listing);
    setShowEditModal(true);
  };

  const handleActivateListing = (listing) => {
    setSelectedListing(listing);
    setShowActivateModal(true);
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce?')) return;
    try {
      await freeListingService.deleteListing(listingId);
      fetchListings(true);
      showToast('Annonce supprimée avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const hasLocationFilter = selectedProvince || selectedVille || selectedCommune;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annonces Gratuites</h1>
          <p className="text-sm text-gray-600 mt-1">Gérez les annonces gratuites pour les clients</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Créer une Annonce Gratuite
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nom, email, téléphone, titre, adresse, prix, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes</option>
              <option value="unpaid">Non payées</option>
              <option value="active">Actives</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchListings(true)}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Location Filters */}
        {!loadingLocations && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filtrer par localisation</span>
              {hasLocationFilter && (
                <button
                  onClick={clearLocationFilters}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Effacer
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Province</label>
                <select
                  value={selectedProvince}
                  onChange={handleProvinceChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Toutes les provinces</option>
                  {getAvailableProvinces().map(p => (
                    <option key={p._id} value={p.nom}>{p.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ville</label>
                <select
                  value={selectedVille}
                  onChange={handleVilleChange}
                  disabled={!selectedProvince}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Toutes les villes</option>
                  {getAvailableVilles().map(v => (
                    <option key={v._id} value={v.nom}>{v.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Commune</label>
                <select
                  value={selectedCommune}
                  onChange={(e) => setSelectedCommune(e.target.value)}
                  disabled={!selectedVille}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Toutes les communes</option>
                  {getAvailableCommunes().map(c => (
                    <option key={c._id} value={c.nom}>{c.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasLocationFilter && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedProvince && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Province: {selectedProvince}
                  </span>
                )}
                {selectedVille && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Ville: {selectedVille}
                  </span>
                )}
                {selectedCommune && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Commune: {selectedCommune}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-3">
          <span>
            {pagination.total > 0
              ? `${listings.length} annonce(s) affichée(s) • Total: ${pagination.total}`
              : 'Aucune annonce trouvée'}
            {debouncedSearch && ` pour "${debouncedSearch}"`}
          </span>
          {pagination.totalPages > 1 && (
            <span>Page {pagination.page} sur {pagination.totalPages}</span>
          )}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MapPin className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune annonce trouvée</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || hasLocationFilter || filterStatus !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par créer votre première annonce gratuite'}
          </p>
          {!searchTerm && !hasLocationFilter && filterStatus === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Créer une Annonce Gratuite
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <FreeListingCard
              key={listing._id}
              listing={listing}
              onEdit={handleEditListing}
              onActivate={handleActivateListing}
              onDelete={handleDeleteListing}
              isAdmin={isAdmin()}
              isSalesPerson={isSalesPerson()}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
            disabled={pagination.page === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Première
          </button>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-gray-700 font-medium">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Dernière
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateFreeListingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleListingCreated}
          userRole={isAdmin() ? 'admin' : isSalesPerson() ? 'salesperson' : 'user'}
        />
      )}
      {showActivateModal && selectedListing && (
        <ActivateFreeListingModal
          listing={selectedListing}
          onClose={() => { setShowActivateModal(false); setSelectedListing(null); }}
          onSuccess={handleListingActivated}
          userRole={isAdmin() ? 'admin' : isSalesPerson() ? 'salesperson' : 'user'}
        />
      )}
      {showEditModal && selectedListing && (
        <EditFreeListingModal
          listing={selectedListing}
          onClose={() => { setShowEditModal(false); setSelectedListing(null); }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedListing(null);
            fetchListings(true);
            showToast('Annonce mise à jour avec succès', 'success');
          }}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default FreeListingsPage;
