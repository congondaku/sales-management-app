import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, X, ShieldCheck, ShieldAlert, Users, UserCheck, UserX, Link2,
} from 'lucide-react';
import realEstateAgentService from '../../services/realEstateAgent.service';
import LoadingSpinner from '../Commons/LoadingSpinner';
import Toast from '../Commons/Toast';
import CreateAgentModal from './CreateAgentModal';
import AgentDetailsModal from './AgentDetailsModal';

const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const KycBadge = ({ status }) => (
  status === 'verified' ? (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
      <ShieldCheck className="h-3 w-3" /> Vérifié
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
      <ShieldAlert className="h-3 w-3" /> En attente
    </span>
  )
);

const AgentsPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('true');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [toast, setToast] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

  const debouncedSearch = useDebounce(searchTerm, 400);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAgents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await realEstateAgentService.listAgents({
        page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        kycStatus: kycFilter || undefined,
        isActive: activeFilter,
      });
      setAgents(response.data || []);
      setPagination(prev => ({
        ...prev,
        page: response.page || page,
        total: response.total || 0,
        pages: response.pages || 0,
      }));
    } catch (e) {
      showToast('Erreur lors du chargement des agents', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, debouncedSearch, kycFilter, activeFilter]);

  useEffect(() => { fetchAgents(1); }, [debouncedSearch, kycFilter, activeFilter]);

  const handleCreated = () => {
    setShowCreateModal(false);
    fetchAgents(1);
    showToast('Agent créé avec succès', 'success');
  };

  const handleUpdated = async () => {
    // Refresh the selected agent's own data so the open modal reflects the change,
    // and refresh the list underneath it.
    if (selectedAgent) {
      try {
        const res = await realEstateAgentService.getAgent(selectedAgent._id);
        setSelectedAgent(res.data);
      } catch {
        // if this fails, the list refresh below still keeps things in sync
      }
    }
    fetchAgents(pagination.page);
  };

  const verifiedCount = agents.filter(a => a.kycStatus === 'verified').length;
  const pendingCount = agents.filter(a => a.kycStatus !== 'verified').length;
  const linkedCount = agents.filter(a => a.linkedUserId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents Immobiliers</h1>
          <p className="text-sm text-gray-600 mt-1">Carnet d'adresses des agents à qui confier les clients</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvel Agent
        </button>
      </div>

      {/* Stats */}
      {!loading && agents.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Sur cette page', value: agents.length, icon: Users, cls: ['border-blue-200', 'bg-blue-50', 'text-blue-600'] },
            { label: 'Vérifiés', value: verifiedCount, icon: ShieldCheck, cls: ['border-green-200', 'bg-green-50', 'text-green-600'] },
            { label: 'En attente KYC', value: pendingCount, icon: ShieldAlert, cls: ['border-amber-200', 'bg-amber-50', 'text-amber-600'] },
            { label: 'Compte lié', value: linkedCount, icon: Link2, cls: ['border-teal-200', 'bg-teal-50', 'text-teal-600'] },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`bg-white border rounded-xl p-3 flex items-center gap-3 ${s.cls[0]}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.cls[1]} ${s.cls[2]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nom, téléphone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts KYC</option>
            <option value="verified">Vérifiés</option>
            <option value="pending">En attente</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="true">Actifs</option>
            <option value="false">Désactivés</option>
            <option value="">Tous</option>
          </select>

          <button
            onClick={() => fetchAgents(pagination.page)}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-3">
          <span>
            {pagination.total > 0
              ? `${agents.length} agent(s) affiché(s) · Total: ${pagination.total}`
              : 'Aucun agent trouvé'}
          </span>
          {pagination.pages > 1 && <span>Page {pagination.page} sur {pagination.pages}</span>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun agent trouvé</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || kycFilter ? 'Essayez de modifier vos filtres' : 'Commencez par ajouter votre premier agent'}
          </p>
          {!searchTerm && !kycFilter && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" /> Nouvel Agent
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Territoire</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KYC</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compte</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map(agent => (
                <tr key={agent._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{agent.firstName} {agent.lastName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{agent.phoneNumber}</p>
                    {agent.email && <p className="text-xs text-gray-400">{agent.email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{agent.territory || '—'}</p>
                  </td>
                  <td className="px-4 py-3"><KycBadge status={agent.kycStatus} /></td>
                  <td className="px-4 py-3">
                    {agent.linkedUserId ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                        <UserCheck className="h-3.5 w-3.5" /> Lié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <UserX className="h-3.5 w-3.5" /> Aucun
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${agent.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {agent.isActive ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedAgent(agent)}
                      className="text-sm text-blue-600 font-semibold hover:text-blue-700"
                    >
                      Gérer
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
            onClick={() => fetchAgents(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-gray-700 font-medium">Page {pagination.page} / {pagination.pages}</span>
          <button
            onClick={() => fetchAgents(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}

      {showCreateModal && (
        <CreateAgentModal onClose={() => setShowCreateModal(false)} onSuccess={handleCreated} />
      )}
      {selectedAgent && (
        <AgentDetailsModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onSuccess={handleUpdated}
          showToast={showToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AgentsPage;
