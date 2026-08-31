import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Save, ShieldCheck, ShieldAlert, Link2, Search, UserX, Power,
} from 'lucide-react';
import apiClient from '../../services/api';
import realEstateAgentService from '../../services/realEstateAgent.service';

// Small self-contained user search, used only to link an agent's own app account.
// Mirrors the pattern already used for user lookups elsewhere in this app.
const UserSearchInline = ({ onSelect }) => {
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
      const res = await apiClient.get(`/users?search=${encodeURIComponent(q)}&limit=10`);
      setResults(res.data?.users || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Rechercher par nom, tél, email..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
          {results.map(u => (
            <button
              key={u._id}
              onClick={() => { onSelect(u); setQuery(''); setOpen(false); setResults([]); }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
            >
              <p className="text-sm font-semibold text-gray-900">{u.firstName} {u.lastName}</p>
              <p className="text-xs text-gray-500">{u.phoneNumber} {u.email ? `· ${u.email}` : ''}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AgentDetailsModal = ({ agent, onClose, onSuccess, showToast }) => {
  const [form, setForm] = useState({
    firstName: agent.firstName || '',
    lastName: agent.lastName || '',
    phoneNumber: agent.phoneNumber || '',
    email: agent.email || '',
    territory: agent.territory || '',
    notes: agent.notes || '',
  });
  const [kycNotes, setKycNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [kycSaving, setKycSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    setError('');
    try {
      setSaving(true);
      await realEstateAgentService.updateAgent(agent._id, form);
      showToast('Agent mis à jour', 'success');
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleKycToggle = async () => {
    const nextStatus = agent.kycStatus === 'verified' ? 'pending' : 'verified';
    try {
      setKycSaving(true);
      await realEstateAgentService.setKycStatus(agent._id, nextStatus, kycNotes || undefined);
      showToast(nextStatus === 'verified' ? 'Agent marqué comme vérifié' : 'Agent remis en attente', 'success');
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la mise à jour du KYC.');
    } finally {
      setKycSaving(false);
    }
  };

  const handleLink = async (user) => {
    try {
      setLinking(true);
      await realEstateAgentService.linkUserAccount(agent._id, user._id);
      showToast('Compte utilisateur lié', 'success');
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la liaison.');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm('Détacher le compte utilisateur de cet agent ?')) return;
    try {
      setUnlinking(true);
      await realEstateAgentService.unlinkUserAccount(agent._id);
      showToast('Compte utilisateur détaché', 'success');
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors du détachement.');
    } finally {
      setUnlinking(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Désactiver cet agent ? Il ne sera plus proposé pour de nouvelles affectations, mais son historique reste intact.')) return;
    try {
      setDeactivating(true);
      await realEstateAgentService.deactivateAgent(agent._id);
      showToast('Agent désactivé', 'success');
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la désactivation.');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{agent.firstName} {agent.lastName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {agent.isActive ? 'Agent actif' : 'Agent désactivé'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {/* KYC block */}
          <div className={`rounded-xl border p-4 ${agent.kycStatus === 'verified' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {agent.kycStatus === 'verified'
                  ? <ShieldCheck className="h-5 w-5 text-green-600" />
                  : <ShieldAlert className="h-5 w-5 text-amber-600" />}
                <div>
                  <p className={`text-sm font-bold ${agent.kycStatus === 'verified' ? 'text-green-800' : 'text-amber-800'}`}>
                    {agent.kycStatus === 'verified' ? 'KYC vérifié' : 'KYC en attente'}
                  </p>
                  <p className="text-xs text-gray-500">Rappel visuel uniquement, ne bloque rien</p>
                </div>
              </div>
              <button
                onClick={handleKycToggle}
                disabled={kycSaving}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-50 ${
                  agent.kycStatus === 'verified'
                    ? 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {kycSaving ? '...' : agent.kycStatus === 'verified' ? 'Remettre en attente' : 'Marquer vérifié'}
              </button>
            </div>
            {agent.kycStatus !== 'verified' && (
              <input
                className="w-full mt-3 border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white"
                placeholder="Note KYC optionnelle..."
                value={kycNotes}
                onChange={e => setKycNotes(e.target.value)}
              />
            )}
          </div>

          {/* Edit fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.phoneNumber}
              onChange={e => set('phoneNumber', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Territoire</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.territory}
              onChange={e => set('territory', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>

          {/* Linked account */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-bold text-gray-900 mb-2">Compte utilisateur lié</p>
            {agent.linkedUserId ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {agent.linkedUserId.firstName} {agent.linkedUserId.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{agent.linkedUserId.phoneNumber}</p>
                </div>
                <button
                  onClick={handleUnlink}
                  disabled={unlinking}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50"
                >
                  <UserX className="h-3.5 w-3.5" /> {unlinking ? '...' : 'Détacher'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  Cet agent n'a pas encore de compte dans l'application. Optionnel, l'agent
                  fonctionne aussi sans compte lié.
                </p>
                <UserSearchInline onSelect={handleLink} />
                {linking && <p className="text-xs text-gray-400">Liaison en cours...</p>}
              </div>
            )}
          </div>

          {/* Deactivate */}
          {agent.isActive && (
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                className="flex items-center gap-2 text-sm text-red-500 font-semibold hover:text-red-600 disabled:opacity-50"
              >
                <Power className="h-4 w-4" /> {deactivating ? 'Désactivation...' : 'Désactiver cet agent'}
              </button>
              <p className="text-xs text-gray-400 mt-1">
                L'agent ne sera plus proposé pour de nouvelles affectations. Son historique
                d'affectations et d'intérêts reste intact.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDetailsModal;
