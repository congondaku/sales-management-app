import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Home, Phone, Mail, Clock, Search, UserCheck, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import interestService from '../../services/interest.service';
import realEstateAgentService from '../../services/realEstateAgent.service';
import LoadingSpinner from '../Commons/LoadingSpinner';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nouveau', cls: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacté', cls: 'bg-amber-100 text-amber-700' },
  { value: 'closed', label: 'Clôturé', cls: 'bg-green-100 text-green-700' },
];

const formatPrice = (listing) => {
  if (!listing) return null;
  const currency = listing.currency || 'USD';
  if (listing.typeOfListing === 'sale' && listing.priceSale) return `${currency} ${listing.priceSale.toLocaleString()}`;
  if (listing.priceMonthly) return `${currency} ${listing.priceMonthly.toLocaleString()} /mois`;
  if (listing.priceDaily) return `${currency} ${listing.priceDaily.toLocaleString()} /jour`;
  return null;
};

const timeAgo = (date) => {
  const h = Math.floor((Date.now() - new Date(date)) / 3600000);
  if (h < 1) return 'Il y a moins d\'1h';
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d} jour${d > 1 ? 's' : ''}`;
};

// Inline search to assign a RealEstateAgent as the handler for one interest
const AssignAgentWidget = ({ onSelect, currentAgent }) => {
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
    try {
      setLoading(true);
      const res = await realEstateAgentService.listAgents({ search: q || undefined, isActive: 'true', limit: 10 });
      setResults(res.data || []);
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

  if (currentAgent) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">{currentAgent.firstName} {currentAgent.lastName}</span>
          {currentAgent.kycStatus === 'verified'
            ? <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
            : <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />}
        </div>
        <button onClick={() => onSelect(null)} className="text-xs text-gray-400 hover:text-gray-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Assigner un agent..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length === 0) search(''); setOpen(true); }}
        />
        {loading && <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto">
          {results.map(a => (
            <button
              key={a._id}
              onClick={() => { onSelect(a); setQuery(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0 text-xs"
            >
              <span className="font-semibold text-gray-900">{a.firstName} {a.lastName}</span>
              <span className="text-gray-400 ml-1">{a.territory || ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const InterestRow = ({ interest, onRefresh, showToast }) => {
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);
  const listing = interest.listing;

  const handleStatusChange = async (status) => {
    try {
      setSavingStatus(true);
      await interestService.updateInterestStatus(interest._id, { status });
      onRefresh();
    } catch {
      showToast('Erreur lors de la mise à jour du statut', 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAgentChange = async (agent) => {
    try {
      setSavingAgent(true);
      await interestService.updateInterestStatus(interest._id, { handledBy: agent?._id || null });
      onRefresh();
    } catch {
      showToast('Erreur lors de l\'assignation', 'error');
    } finally {
      setSavingAgent(false);
    }
  };

  const statusCfg = STATUS_OPTIONS.find(s => s.value === interest.status) || STATUS_OPTIONS[0];
  const price = formatPrice(listing);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Home className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{listing?.title || 'Annonce supprimée'}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {price && <span className="text-xs text-blue-600 font-semibold">{price}</span>}
              {listing?.status && <span className="text-xs text-gray-400">{listing.status}</span>}
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
          <Clock className="h-3 w-3" /> {timeAgo(interest.createdAt)}
        </span>
      </div>

      {interest.message && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{interest.message}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap pt-1">
        {/* Status pills */}
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              disabled={savingStatus}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors disabled:opacity-50 ${
                interest.status === opt.value ? opt.cls : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-1">
        <p className="text-xs text-gray-400 mb-1">Agent assigné</p>
        <div className={savingAgent ? 'opacity-50 pointer-events-none' : ''}>
          <AssignAgentWidget currentAgent={interest.handledBy} onSelect={handleAgentChange} />
        </div>
      </div>
    </div>
  );
};

const UserInterestsModal = ({ userId, onClose, showToast }) => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInterests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await interestService.getInterestsForUser(userId);
      setInterests(res.data || []);
    } catch {
      showToast('Erreur lors du chargement des intérêts', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchInterests(); }, [fetchInterests]);

  const user = interests[0]?.user;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {user ? `${user.firstName} ${user.lastName}` : 'Intérêts de l\'utilisateur'}
            </h2>
            {user && (
              <div className="flex items-center gap-3 mt-1">
                {user.phoneNumber && (
                  <span className="text-sm text-gray-500 flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {user.phoneNumber}</span>
                )}
                {user.email && (
                  <span className="text-sm text-gray-500 flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : interests.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Aucun intérêt trouvé pour cet utilisateur.</p>
          ) : (
            <div className="space-y-3">
              {interests.map(i => (
                <InterestRow key={i._id} interest={i} onRefresh={fetchInterests} showToast={showToast} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInterestsModal;
