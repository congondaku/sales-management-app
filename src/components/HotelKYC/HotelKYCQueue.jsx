import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Clock, Lock, Search, RefreshCw,
  ChevronRight, AlertCircle, CheckCircle, User
} from 'lucide-react';
import hotelKycService from '../../services/hotelKyc.service';
import LoadingSpinner from '../Commons/LoadingSpinner';
import Toast from '../Commons/Toast';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatTimeLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return 'Expiré';
  const mins = Math.floor(diff / 60000);
  return `${mins} min restantes`;
};

const LockBadge = ({ lock }) => {
  if (!lock?.isLocked) return null;

  if (lock.isLockedByMe) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Lock className="h-3 w-3" />
        En cours (vous) · {formatTimeLeft(lock.expiresAt)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <Lock className="h-3 w-3" />
      En cours · {lock.lockedBy?.name}
    </span>
  );
};

const HotelKYCQueue = ({ onSelectAccount }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAccounts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await hotelKycService.getPending(page, pagination.limit);
      setAccounts(data.accounts || []);
      setPagination(prev => ({
        ...prev,
        page,
        total: data.total || 0,
        pages: data.pagination?.pages || 0,
      }));
    } catch (err) {
      showToast('Erreur lors du chargement de la file', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchAccounts(1);
  }, []);

  const filtered = accounts.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.businessName?.toLowerCase().includes(s) ||
      a.fullName?.toLowerCase().includes(s) ||
      a.email?.toLowerCase().includes(s) ||
      a.city?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File KYC Hôtels</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total} dossier{pagination.total !== 1 ? 's' : ''} en attente · ordre d'arrivée
          </p>
        </div>
        <button
          onClick={() => fetchAccounts(pagination.page)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, ville..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Queue Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">File vide</h3>
          <p className="text-gray-500 text-sm">Aucun dossier KYC en attente de vérification.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Établissement</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Localisation</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Soumis le</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((account, idx) => (
                <tr
                  key={account.id}
                  className={`group hover:bg-blue-50 transition-colors cursor-pointer ${
                    account.lock?.isLocked && !account.lock?.isLockedByMe ? 'opacity-60' : ''
                  }`}
                  onClick={() => onSelectAccount(account)}
                >
                  <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                    {(pagination.page - 1) * pagination.limit + idx + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{account.businessName}</p>
                        <p className="text-xs text-gray-500">{account.fullName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{account.email}</p>
                    <p className="text-xs text-gray-500">{account.phoneNumber}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {account.city}{account.province ? `, ${account.province}` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      {formatDate(account.submittedAt)}
                    </div>
                    {account.kyc?.resubmittedAt && (
                      <p className="text-xs text-amber-600 mt-0.5">Resoumission</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <LockBadge lock={account.lock} />
                    {!account.lock?.isLocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <AlertCircle className="h-3 w-3" />
                        Disponible
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {pagination.page} sur {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchAccounts(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() => fetchAccounts(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default HotelKYCQueue;
