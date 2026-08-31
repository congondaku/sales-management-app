import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, X, Link2, Unlink, Clock, Phone, Mail, ShieldCheck, ShieldAlert,
  Users, UserCheck, History, ArrowRight,
} from 'lucide-react';
import apiClient from '../../services/api';
import realEstateAgentService from '../../services/realEstateAgent.service';
import agentAssignmentService from '../../services/agentAssignment.service';
import LoadingSpinner from '../Commons/LoadingSpinner';
import Toast from '../Commons/Toast';

const timeAgo = (date) => {
  if (!date) return null;
  const h = Math.floor((Date.now() - new Date(date)) / 3600000);
  if (h < 1) return 'Il y a moins d\'1h';
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d} jour${d > 1 ? 's' : ''}`;
};

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Generic search box, reused for both client (User) and agent (RealEstateAgent) lookup ───

const EntitySearch = ({ placeholder, searchFn, onSelect, renderResult, accentColor = 'blue' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); return; }
    try {
      setLoading(true);
      const found = await searchFn(q);
      setResults(found);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchFn]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const ring = accentColor === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-blue-500';
  const spin = accentColor === 'purple' ? 'border-purple-500' : 'border-blue-500';

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          className={`w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ring} focus:border-transparent`}
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 ${spin} border-t-transparent rounded-full animate-spin`} />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-56 overflow-y-auto">
          {results.map(item => (
            <button
              key={item._id}
              onClick={() => { onSelect(item); setQuery(''); setOpen(false); setResults([]); }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
            >
              {renderResult(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const searchClients = async (q) => {
  const res = await apiClient.get(`/users?search=${encodeURIComponent(q)}&limit=10`);
  return res.data?.users || [];
};

const searchAgentsFn = async (q) => {
  const res = await realEstateAgentService.listAgents({ search: q, isActive: 'true', limit: 10 });
  return res.data || [];
};

// ─── Client-first view ────────────────────────────────────────────────────

const ClientAssignmentView = ({ showToast }) => {
  const [client, setClient] = useState(null);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  const loadAssignment = useCallback(async (clientId) => {
    setLoading(true);
    try {
      const [curRes, histRes] = await Promise.all([
        agentAssignmentService.getClientAssignment(clientId),
        agentAssignmentService.getAssignmentHistory(clientId),
      ]);
      setCurrent(curRes.data);
      setHistory(histRes.data || []);
    } catch {
      showToast('Erreur lors du chargement de l\'assignation', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleSelectClient = (c) => {
    setClient(c);
    setNotes('');
    loadAssignment(c._id);
  };

  const handleAssign = async (agent) => {
    if (!client) return;
    try {
      setAssigning(true);
      await agentAssignmentService.assignAgent(client._id, agent._id, notes);
      showToast(current ? 'Client réassigné' : 'Client assigné à l\'agent', 'success');
      setNotes('');
      loadAssignment(client._id);
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur lors de l\'assignation', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!client) return;
    if (!window.confirm('Détacher cet agent de ce client ?')) return;
    try {
      setUnassigning(true);
      await agentAssignmentService.unassignAgent(client._id);
      showToast('Agent détaché', 'success');
      loadAssignment(client._id);
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur lors du détachement', 'error');
    } finally {
      setUnassigning(false);
    }
  };

  return (
    <div className="space-y-5">
      {!client ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Rechercher un client</p>
          <EntitySearch
            placeholder="Nom, téléphone, email du client..."
            searchFn={searchClients}
            onSelect={handleSelectClient}
            renderResult={(u) => (
              <div>
                <p className="text-sm font-semibold text-gray-900">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-gray-500">{u.phoneNumber} {u.email ? `· ${u.email}` : ''}</p>
              </div>
            )}
          />
        </div>
      ) : (
        <>
          {/* Selected client header */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">{client.firstName} {client.lastName}</p>
              <div className="flex items-center gap-3 mt-0.5">
                {client.phoneNumber && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {client.phoneNumber}</span>}
                {client.email && <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" /> {client.email}</span>}
              </div>
            </div>
            <button onClick={() => setClient(null)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <X className="h-3.5 w-3.5" /> Changer de client
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            <>
              {/* Current assignment */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-sm font-bold text-gray-900 mb-3">Agent actuel</p>
                {current ? (
                  <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{current.agent?.firstName} {current.agent?.lastName}</p>
                        <p className="text-xs text-gray-500">{current.agent?.phoneNumber}</p>
                      </div>
                      {current.agent?.kycStatus === 'verified'
                        ? <ShieldCheck className="h-4 w-4 text-green-600" />
                        : <ShieldAlert className="h-4 w-4 text-amber-500" />}
                    </div>
                    <button
                      onClick={handleUnassign}
                      disabled={unassigning}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50"
                    >
                      <Unlink className="h-3.5 w-3.5" /> {unassigning ? '...' : 'Détacher'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun agent assigné à ce client actuellement.</p>
                )}
              </div>

              {/* Assign / reassign */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-bold text-gray-900">{current ? 'Réassigner à un autre agent' : 'Assigner un agent'}</p>
                <EntitySearch
                  placeholder="Rechercher un agent par nom, territoire..."
                  searchFn={searchAgentsFn}
                  onSelect={handleAssign}
                  accentColor="purple"
                  renderResult={(a) => (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{a.firstName} {a.lastName}</p>
                        <p className="text-xs text-gray-500">{a.territory || a.phoneNumber}</p>
                      </div>
                      {a.kycStatus === 'verified'
                        ? <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                        : <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                    </div>
                  )}
                />
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={2}
                  placeholder="Notes optionnelles..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
                {assigning && <p className="text-xs text-gray-400">Assignation en cours...</p>}
              </div>

              {/* History */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <History className="h-4 w-4 text-gray-400" /> Historique complet
                </p>
                {history.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucune assignation passée pour ce client.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map(h => (
                      <div key={h._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{h.agent?.firstName} {h.agent?.lastName}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${h.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                            {h.status === 'active' ? 'Actif' : 'Terminé'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(h.createdAt)}{h.unassignedAt ? ` → ${formatDate(h.unassignedAt)}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// ─── Agent-first view ─────────────────────────────────────────────────────

const AgentClientsView = ({ showToast }) => {
  const [agent, setAgent] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadClients = useCallback(async (agentId) => {
    setLoading(true);
    try {
      const res = await agentAssignmentService.getAgentClients(agentId);
      setClients(res.data || []);
    } catch {
      showToast('Erreur lors du chargement des clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleSelectAgent = (a) => {
    setAgent(a);
    loadClients(a._id);
  };

  return (
    <div className="space-y-5">
      {!agent ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Rechercher un agent</p>
          <EntitySearch
            placeholder="Nom, territoire de l'agent..."
            searchFn={searchAgentsFn}
            onSelect={handleSelectAgent}
            accentColor="purple"
            renderResult={(a) => (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{a.firstName} {a.lastName}</p>
                  <p className="text-xs text-gray-500">{a.territory || a.phoneNumber}</p>
                </div>
                {a.kycStatus === 'verified'
                  ? <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                  : <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0" />}
              </div>
            )}
          />
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900">{agent.firstName} {agent.lastName}</p>
              {agent.kycStatus === 'verified'
                ? <ShieldCheck className="h-4 w-4 text-green-600" />
                : <ShieldAlert className="h-4 w-4 text-amber-500" />}
            </div>
            <button onClick={() => setAgent(null)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <X className="h-3.5 w-3.5" /> Changer d'agent
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : clients.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucun client assigné à cet agent actuellement.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {clients.map((a, i) => (
                <div key={a._id} className={`flex items-center justify-between p-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{a.client?.firstName} {a.client?.lastName}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {a.client?.phoneNumber && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {a.client.phoneNumber}</span>}
                      {a.client?.email && <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" /> {a.client.email}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {timeAgo(a.assignedAt || a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────

const AssignmentsPage = () => {
  const [tab, setTab] = useState('client'); // 'client' | 'agent'
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Affectations</h1>
        <p className="text-sm text-gray-600 mt-1">Lier ou délier un client et un agent immobilier</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('client')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px flex items-center gap-2 ${tab === 'client' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Link2 className="h-4 w-4" /> Par client
        </button>
        <button
          onClick={() => setTab('agent')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px flex items-center gap-2 ${tab === 'agent' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="h-4 w-4" /> Par agent
        </button>
      </div>

      {tab === 'client' ? <ClientAssignmentView showToast={showToast} /> : <AgentClientsView showToast={showToast} />}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AssignmentsPage;
