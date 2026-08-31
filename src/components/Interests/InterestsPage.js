import React, { useState, useEffect, useCallback } from 'react';
import { HeartHandshake, Phone, Mail, Clock, RefreshCw } from 'lucide-react';
import interestService from '../../services/interest.service';
import LoadingSpinner from '../Commons/LoadingSpinner';
import Toast from '../Commons/Toast';
import UserInterestsModal from './UserInterestsModal';

const timeAgo = (date) => {
  const h = Math.floor((Date.now() - new Date(date)) / 3600000);
  if (h < 1) return 'Il y a moins d\'1h';
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d} jour${d > 1 ? 's' : ''}`;
};

const InterestsPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [toast, setToast] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, pages: 0 });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await interestService.getInterestedUsers(page, pagination.limit);
      setUsers(res.data || []);
      setPagination(prev => ({ ...prev, page: res.page || page, total: res.total || 0, pages: res.pages || 0 }));
    } catch {
      showToast('Erreur lors du chargement des utilisateurs intéressés', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => { fetchUsers(1); }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intérêts</h1>
          <p className="text-sm text-gray-600 mt-1">Utilisateurs ayant manifesté un intérêt pour une annonce</p>
        </div>
        <button
          onClick={() => fetchUsers(pagination.page)}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      {!loading && users.length > 0 && (
        <div className="bg-white border border-blue-200 rounded-xl p-3 flex items-center gap-3 w-fit">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <HeartHandshake className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{pagination.total}</p>
            <p className="text-xs text-gray-500">Utilisateur(s) intéressé(s)</p>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <HeartHandshake className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun intérêt pour le moment</h3>
          <p className="text-gray-500">Les manifestations d'intérêt des clients apparaîtront ici.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intérêts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernier intérêt</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(row => (
                <tr key={row.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.user.profileImage ? (
                        <img src={row.user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-700">
                            {row.user.firstName?.[0]}{row.user.lastName?.[0]}
                          </span>
                        </div>
                      )}
                      <p className="text-sm font-semibold text-gray-900">{row.user.firstName} {row.user.lastName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {row.user.phoneNumber && (
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {row.user.phoneNumber}</span>
                      )}
                      {row.user.email && (
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" /> {row.user.email}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      {row.interestCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {timeAgo(row.lastInterestAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedUserId(row.userId)}
                      className="text-sm text-blue-600 font-semibold hover:text-blue-700"
                    >
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => fetchUsers(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-gray-700 font-medium">Page {pagination.page} / {pagination.pages}</span>
          <button
            onClick={() => fetchUsers(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}

      {selectedUserId && (
        <UserInterestsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          showToast={showToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default InterestsPage;
