import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import freeListingService from '../../services/freeListing.service';
import LoadingSpinner from '../Commons/LoadingSpinner';
import CreateFreeListingModal from './CreateFreeListingModal';
import ActivateFreeListingModal from './ActivateFreeListingModal';
import EditFreeListingModal from './EditFreeListingModal';
import FreeListingCard from './FreeListingCard';
import Toast from '../Commons/Toast';

const FreeListingsPage = () => {
  const { user, isAdmin, isSalesPerson } = useAuth();
  
  // State
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, unpaid, active
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [toast, setToast] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Fetch listings
  const fetchListings = async () => {
    setLoading(true);
    try {
      let response;
      
      if (filterStatus === 'unpaid') {
        response = await freeListingService.getUnpaidListings(
          pagination.page,
          pagination.limit
        );
        setListings(response.listings || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        }));
      } else {
        response = await freeListingService.getAllListings({
          page: pagination.page,
          limit: pagination.limit,
          status: filterStatus === 'active' ? 'available' : undefined
        });
        setListings(response.listings || []);
      }
    } catch (error) {
      showToast('Erreur lors du chargement des annonces', 'error');
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [pagination.page, filterStatus]);

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle create listing success
  const handleListingCreated = (listing) => {
    setShowCreateModal(false);
    setSelectedListing(listing);
    setShowActivateModal(true);
    showToast('Annonce créée avec succès! Activez-la maintenant.', 'success');
  };

  // Handle activate listing success
  const handleListingActivated = () => {
    setShowActivateModal(false);
    setSelectedListing(null);
    fetchListings();
    showToast('Annonce activée avec succès!', 'success');
  };

  // Handle edit listing
  const handleEditListing = (listing) => {
    setSelectedListing(listing);
    setShowEditModal(true);
  };

  // Handle activate existing listing
  const handleActivateListing = (listing) => {
    setSelectedListing(listing);
    setShowActivateModal(true);
  };

  // Handle delete listing
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce?')) {
      return;
    }

    try {
      await freeListingService.deleteListing(listingId);
      fetchListings();
      showToast('Annonce supprimée avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
      console.error('Error deleting listing:', error);
    }
  };

  // Filter listings by search term
  const filteredListings = listings.filter(listing => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      listing.title?.toLowerCase().includes(searchLower) ||
      listing.address?.toLowerCase().includes(searchLower) ||
      listing.commune?.toLowerCase().includes(searchLower) ||
      listing.ville?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Annonces Gratuites
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Gérez les annonces gratuites pour les clients
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Créer une Annonce Gratuite
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, adresse, commune..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
            onClick={fetchListings}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            {filteredListings.length} annonce(s) trouvée(s)
          </span>
          {pagination.total > 0 && (
            <span>
              Page {pagination.page} sur {pagination.totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">Aucune annonce trouvée</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Créer votre première annonce gratuite
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
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
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateFreeListingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleListingCreated}
          userRole={isAdmin() ? 'admin' : 'salesperson'}
        />
      )}

      {showActivateModal && selectedListing && (
        <ActivateFreeListingModal
          listing={selectedListing}
          onClose={() => {
            setShowActivateModal(false);
            setSelectedListing(null);
          }}
          onSuccess={handleListingActivated}
          userRole={isAdmin() ? 'admin' : 'salesperson'}
        />
      )}

      {showEditModal && selectedListing && (
        <EditFreeListingModal
          listing={selectedListing}
          onClose={() => {
            setShowEditModal(false);
            setSelectedListing(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedListing(null);
            fetchListings();
            showToast('Annonce mise à jour avec succès', 'success');
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default FreeListingsPage;
