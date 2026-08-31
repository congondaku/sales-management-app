import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { SectionSpinner } from '../Commons/LoadingSpinner';
import apiClient from '../../services/api';

const Communes = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [listings, setListings] = useState([]);
  const [communesData, setCommunesData] = useState([]);
  const [communeCounts, setCommuneCounts] = useState([]);
  // const unique = [...new Set(listings)]

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (listings.length > 0 && communesData.length > 0) {
      calculateCommuneCounts();
    }
  }, [listings, communesData]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchListings(), loadCommunes()]);
    setLoading(false);
  };

  const fetchListings = async () => {
    try {
      setError(null);
      const allListings = [];
      let page = 1;
      let hasMorePages = true;

      while (hasMorePages && page <= 20) {
        const response = await fetch(
          `https://nd-ca63c97939154afda89f1e74f48e5d0d.ecs.us-east-1.on.aws/api/listings?page=${page}&limit=50`
        );

        if (response.ok) {
          const data = await response.json();
          const pageListings = data.listings?.map(x => x.commune) || [];

          if (pageListings.length === 0) {
            hasMorePages = false;
            break;
          }

          allListings.push(...pageListings);
          hasMorePages = pageListings.length === 50;
          page++;
        } else {
          hasMorePages = false;
        }
      }

      setListings(allListings);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Erreur lors du chargement des annonces');
    }
  };

  const loadCommunes = async () => {
    try {
      const response = await apiClient.get('/administrative-divisions/provinces');
      const kinshasa = response.data.data.find(province => province.nom === "Kinshasa");
      
      if (kinshasa) {
        const communes = kinshasa.villes
          .flatMap(ville => ville.communes)
          .map(commune => commune.nom);
        setCommunesData(communes);
      }
    } catch (error) {
      console.error("Error loading communes:", error);
      setError('Erreur lors du chargement des communes');
    }
  };

  const calculateCommuneCounts = () => {
    const counts = communesData.map(commune => {
      const count = listings.filter(listing => listing === commune).length;
      return {
        commune,
        count,
        label: `${commune}: ${count} annonce${count > 1 ? 's' : ''}`
      };
    });
    counts.sort((a, b) => b.count - a.count);
    setCommuneCounts(counts);
  };

  const filteredCommunes = communeCounts.filter(commune =>
    commune.commune.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <SectionSpinner text="Chargement des données..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-black">
          Communes de Kinshasa
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Statistiques des annonces par commune
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-red-600 dark:text-red-400 hover:underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une commune..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Communes</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{communesData.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Annonces</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{listings.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Communes Actives</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {communeCounts.filter(c => c.count > 0).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Commune
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre d'annonces
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Détails
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCommunes.length > 0 ? (
                filteredCommunes.map((commune, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {commune.commune}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        commune.count > 0
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {commune.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        commune.count > 0
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {commune.label}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'Aucune commune trouvée' : 'Chargement...'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Communes;
