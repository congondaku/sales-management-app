import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, X, Phone, MessageCircle, MapPin, Home,
  Clock, ChevronDown, ChevronUp, RefreshCw, Trash2,
  CheckCircle, AlertCircle, SlidersHorizontal, Users,
  UserCheck, Unlock, Lock, Timer, TrendingUp, AlertTriangle,
  User, Eye, EyeOff, Link2, LinkIcon, UserPlus, ArrowRight,
  Bed, Star
} from 'lucide-react';
import apiClient from '../../services/api';
import { apiHelpers } from '../../services/api';
import LocationSelector from './LocationSelector';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'apartment', label: 'Appartement' }, { value: 'house', label: 'Maison' },
  { value: 'studio', label: 'Studio' },         { value: 'villa', label: 'Villa' },
  { value: 'office', label: 'Bureau' },          { value: 'land', label: 'Terrain' },
  { value: 'shop', label: 'Boutique' },          { value: 'warehouse', label: 'Entrepôt' },
  { value: 'plot', label: 'Parcelle' },          { value: 'compound', label: 'Complexe' },
];

const LISTING_TYPES = [
  { value: '', label: 'Tout' },
  { value: 'rent', label: 'À louer' },
  { value: 'sale', label: 'À vendre' },
  { value: 'daily', label: 'Journalier' },
];

const SORT_OPTIONS = [
  { value: 'expiring', label: 'Expire bientôt' },
  { value: 'newest',   label: 'Plus récent' },
  { value: 'oldest',   label: 'Plus ancien' },
];

const CLAIM_STATUS_TABS = [
  { value: '',            label: 'Toutes' },
  { value: 'unclaimed',   label: 'Disponibles' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'fulfilled',   label: 'Traitées' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDaysLeft = (expiresAt) => {
  if (!expiresAt) return 999;
  return Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / 86400000));
};

const getUrgencyConfig = (daysLeft) => {
  if (daysLeft <= 3)  return { color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-300',    bar: 'bg-red-500',    left: 'border-l-red-400' };
  if (daysLeft <= 7)  return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300', bar: 'bg-orange-500', left: 'border-l-orange-400' };
  if (daysLeft <= 14) return { color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-300',   bar: 'bg-blue-500',   left: 'border-l-blue-400' };
  return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300', bar: 'bg-green-500', left: 'border-l-green-400' };
};

const formatBudget = (budget) => {
  if (!budget?.min && !budget?.max) return null;
  return `${budget.currency || 'USD'} ${budget.min?.toLocaleString() || '0'} — ${budget.max?.toLocaleString() || '∞'}`;
};

const timeAgo = (date) => {
  const h = Math.floor((Date.now() - new Date(date)) / 3600000);
  if (h < 1)  return 'Il y a moins d\'1h';
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d} jour${d > 1 ? 's' : ''}`;
};

const hoursRemaining = (date) => {
  if (!date) return 0;
  return Math.max(0, Math.ceil((new Date(date) - Date.now()) / 3600000));
};

// ─── User Avatar ──────────────────────────────────────────────────────────────

const UserAvatar = ({ user, size = 'md', label }) => {
  const sz = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }[size];
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '?';
  return (
    <div className="flex items-center gap-2">
      {user?.profileImage
        ? <img src={user.profileImage} alt="" className={`${sz} rounded-full object-cover border-2 border-white shadow`} />
        : <div className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold shadow`}>{initials}</div>
      }
      {label && (
        <div>
          <p className="text-xs text-gray-400 leading-none">{label}</p>
          <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
            {user ? `${user.firstName} ${user.lastName}` : '—'}
          </p>
          {user?.phoneNumber && <p className="text-xs text-gray-500 mt-0.5">{user.phoneNumber}</p>}
        </div>
      )}
    </div>
  );
};

// ─── Claim Status Badge ───────────────────────────────────────────────────────

const ClaimBadge = ({ req }) => {
  if (req.claimStatus === 'fulfilled') return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
      <CheckCircle className="h-3 w-3" /> Traité
    </span>
  );
  if (req.claimStatus === 'in_progress') {
    const hrs = hoursRemaining(req.claimExpiresAt);
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full ${hrs < 12 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
        <Clock className="h-3 w-3" /> En cours · {hrs}h
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
      <Unlock className="h-3 w-3" /> Disponible
    </span>
  );
};

// ─── User Search Widget (reused for both requester entry and fulfiller link) ──

const UserSearchWidget = ({ placeholder, onSelect, selectedUser, onClear, accentColor = 'blue' }) => {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);
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
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const accent = {
    blue:   { ring: 'focus:ring-blue-500',   btn: 'bg-blue-600 hover:bg-blue-700',   badge: 'bg-blue-50 border-blue-200 text-blue-800' },
    purple: { ring: 'focus:ring-purple-500', btn: 'bg-purple-600 hover:bg-purple-700', badge: 'bg-purple-50 border-purple-200 text-purple-800' },
    green:  { ring: 'focus:ring-green-500',  btn: 'bg-green-600 hover:bg-green-700',  badge: 'bg-green-50 border-green-200 text-green-800' },
  }[accentColor];

  if (selectedUser) {
    return (
      <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${accent.badge}`}>
        <UserAvatar user={selectedUser} size="sm" label="Sélectionné" />
        <button onClick={onClear} className="p-1 hover:bg-white rounded-lg transition-colors">
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          className={`w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent`}
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
          {results.map(u => (
            <button key={u._id} onClick={() => { onSelect(u); setQuery(''); setOpen(false); setResults([]); }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
            >
              <div className="flex items-center gap-3">
                <UserAvatar user={u} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-500">{u.phoneNumber} {u.email ? `· ${u.email}` : ''}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Link Fulfiller Panel ─────────────────────────────────────────────────────
// Shows inside the expanded request card — agent searches for the user
// who called saying they have a matching property, then links them

const LinkFulfillerPanel = ({ req, onRefresh }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [notes,        setNotes]        = useState('');
  const [linking,      setLinking]      = useState(false);
  const [unlinking,    setUnlinking]    = useState(false);
  const [error,        setError]        = useState('');

  const alreadyLinked = !!req.fulfilledByUser;

  const handleLink = async () => {
    if (!selectedUser) return;
    setError('');
    try {
      setLinking(true);
      await apiClient.post(`/property-requests/${req._id}/link-fulfiller`, {
        userId: selectedUser._id,
        notes: notes || undefined,
      });
      onRefresh();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors du lien');
    } finally { setLinking(false); }
  };

  const handleUnlink = async () => {
    if (!window.confirm('Supprimer le lien avec ce fournisseur ?')) return;
    try {
      setUnlinking(true);
      await apiClient.delete(`/property-requests/${req._id}/unlink-fulfiller`);
      onRefresh();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    } finally { setUnlinking(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
        <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Link2 className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-green-800">Fournisseur potentiel</p>
          <p className="text-xs text-green-600">L'utilisateur qui a appelé et peut satisfaire cette demande</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
          </div>
        )}

        {alreadyLinked ? (
          /* Already linked — show the fulfiller info */
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
              <UserAvatar user={req.fulfilledByUser} size="md" label="Fournisseur lié" />
              <div className="flex items-center gap-1.5">
                {req.fulfilledByUser?.phoneNumber && (
                  <>
                    <a href={`tel:${req.fulfilledByUser.phoneNumber}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                      <Phone className="h-3 w-3" /> Appeler
                    </a>
                    <a href={`https://wa.me/${req.fulfilledByUser.phoneNumber.replace(/[^0-9]/g,'')}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </a>
                  </>
                )}
                <button onClick={handleUnlink} disabled={unlinking}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50">
                  <X className="h-3 w-3" /> {unlinking ? '...' : 'Délier'}
                </button>
              </div>
            </div>
            {req.fulfillmentNotes && (
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">Notes</p>
                <p className="text-sm text-gray-700">{req.fulfillmentNotes}</p>
              </div>
            )}
            {req.fulfillmentLinkedAt && (
              <p className="text-xs text-gray-400 text-center">Lié {timeAgo(req.fulfillmentLinkedAt)}</p>
            )}
          </div>
        ) : (
          /* Not yet linked — search widget */
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Recherchez l'utilisateur qui a contacté l'entreprise avec un bien correspondant à cette demande.
            </p>
            <UserSearchWidget
              placeholder="Rechercher par nom, tél, email..."
              onSelect={setSelectedUser}
              selectedUser={selectedUser}
              onClear={() => setSelectedUser(null)}
              accentColor="green"
            />
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={2}
              placeholder="Notes optionnelles (ex: a un appartement à Gombe disponible immédiatement)..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <button
              onClick={handleLink}
              disabled={!selectedUser || linking}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Link2 className="h-4 w-4" />
              {linking ? 'Liaison...' : 'Lier comme fournisseur'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Three-Actor Summary ──────────────────────────────────────────────────────
// Visual bridge: Requester → Agent managing → Fulfiller

const ThreeActorSummary = ({ req }) => {
  const requester = req.clientUser || req.requestedBy;
  const agent     = req.claimedBy;
  const fulfiller = req.fulfilledByUser;

  return (
    <div className="bg-gradient-to-r from-blue-50 via-gray-50 to-green-50 rounded-xl border border-gray-100 p-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Chaîne de la demande</p>
      <div className="flex items-center gap-2">
        {/* Requester */}
        <div className="flex-1 text-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center mx-auto mb-1.5">
            {requester?.profileImage
              ? <img src={requester.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
              : <span className="text-sm font-bold text-blue-700">{requester?.firstName?.[0] || '?'}</span>
            }
          </div>
          <p className="text-xs font-bold text-gray-800 truncate">{requester ? `${requester.firstName} ${requester.lastName}` : '—'}</p>
          <p className="text-xs text-blue-600 font-semibold mt-0.5">Demandeur</p>
          {requester?.phoneNumber && <p className="text-xs text-gray-400 truncate">{requester.phoneNumber}</p>}
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center mx-auto">
              <span className="text-xs font-bold text-purple-700">{agent?.firstName?.[0] || 'A'}</span>
            </div>
            <p className="text-xs text-purple-600 font-semibold mt-0.5 whitespace-nowrap">Agent</p>
            {agent && <p className="text-xs text-gray-500 truncate max-w-16">{agent.firstName}</p>}
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>

        {/* Fulfiller */}
        <div className="flex-1 text-center">
          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mx-auto mb-1.5 ${fulfiller ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-dashed border-gray-300'}`}>
            {fulfiller?.profileImage
              ? <img src={fulfiller.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
              : fulfiller
                ? <span className="text-sm font-bold text-green-700">{fulfiller.firstName?.[0]}</span>
                : <UserPlus className="h-4 w-4 text-gray-400" />
            }
          </div>
          <p className="text-xs font-bold text-gray-800 truncate">{fulfiller ? `${fulfiller.firstName} ${fulfiller.lastName}` : 'À lier'}</p>
          <p className={`text-xs font-semibold mt-0.5 ${fulfiller ? 'text-green-600' : 'text-gray-400'}`}>Fournisseur</p>
          {fulfiller?.phoneNumber && <p className="text-xs text-gray-400 truncate">{fulfiller.phoneNumber}</p>}
        </div>
      </div>
    </div>
  );
};

// ─── Request Row ──────────────────────────────────────────────────────────────

const RequestRow = ({ req, onRefresh, currentSalesPersonId, isSalesPerson }) => {
  const [expanded,     setExpanded]     = useState(false);
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [claiming,     setClaiming]     = useState(false);
  const [releasing,    setReleasing]    = useState(false);
  const [fulfilling,   setFulfilling]   = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  const daysLeft  = getDaysLeft(req.expiresAt);
  const urgency   = getUrgencyConfig(daysLeft);
  const totalDays = { '1_week':7,'2_weeks':14,'1_month':30,'2_months':60,'3_months':90 }[req.timeframe] || 30;
  const pct       = Math.min(100, (daysLeft / totalDays) * 100);

  const propLabel = PROPERTY_TYPES.find(p => p.value === req.typeOfProperty)?.label || req.typeOfProperty;
  const listLabel = LISTING_TYPES.find(l => l.value === req.listingType)?.label || req.listingType;
  const communes  = req.locations?.map(l => l.commune).filter(Boolean).join(', ') || '—';
  const budget    = formatBudget(req.budget);

  const isMyClaim = req.claimedBy && String(req.claimedBy._id || req.claimedBy) === String(currentSalesPersonId);
  const isLocked  = req.claimStatus === 'in_progress' && !isMyClaim;

  // The person who made the request (could be direct user or agent-entered client)
  const requester     = req.clientUser || req.requestedBy;
  const contactPhone  = req.clientPhone || requester?.phoneNumber;
  const waPhone       = contactPhone?.replace(/[^0-9]/g, '');

  const handleClaim = async () => {
    try { setClaiming(true); await apiClient.post(`/property-requests/${req._id}/claim`); onRefresh(); }
    catch (e) { alert(e.response?.data?.message || 'Erreur'); }
    finally { setClaiming(false); }
  };

  const handleRelease = async () => {
    if (!window.confirm('Libérer cette demande ?')) return;
    try { setReleasing(true); await apiClient.post(`/property-requests/${req._id}/release`); onRefresh(); }
    catch (e) { alert(e.response?.data?.message || 'Erreur'); }
    finally { setReleasing(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette demande ?')) return;
    try { setDeleting(true); await apiClient.delete(`/property-requests/${req._id}/agent-cancel`); onRefresh(); }
    catch (e) { alert(e.response?.data?.message || 'Erreur'); }
    finally { setDeleting(false); }
  };

  const handleFulfill = async () => {
    if (!window.confirm('Marquer comme traitée ?')) return;
    try { setFulfilling(true); await apiClient.patch(`/property-requests/${req._id}/agent-fulfill`); onRefresh(); }
    catch (e) { alert(e.response?.data?.message || 'Erreur'); }
    finally { setFulfilling(false); }
  };

  return (
    <div className={`bg-white border rounded-xl overflow-visible transition-all hover:shadow-sm border-l-4 ${urgency.left}`}>

      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        {/* Urgency badge */}
        <div className={`flex-shrink-0 w-14 h-14 ${urgency.bg} rounded-xl flex flex-col items-center justify-center`}>
          <span className={`text-lg font-bold ${urgency.color}`}>{daysLeft}</span>
          <span className={`text-xs font-semibold ${urgency.color}`}>jours</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">{propLabel}</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-600">{listLabel}</span>
            {budget && <><span className="text-gray-300">·</span><span className="text-sm text-blue-600 font-semibold">{budget}</span></>}
            {req.createdBySalesperson && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                <Users className="h-3 w-3" /> Via agent
              </span>
            )}
            {/* Fulfiller linked indicator */}
            {req.fulfilledByUser && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                <Link2 className="h-3 w-3" /> Fournisseur lié
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-xs">{communes}</span>
            </div>
            <span className="text-xs text-gray-400">{timeAgo(req.createdAt)}</span>
            {/* Requester mini avatar */}
            {requester && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-700">{requester.firstName?.[0]}</span>
                </div>
                <span className="text-xs text-gray-600 font-medium">{requester.firstName} {requester.lastName}</span>
              </div>
            )}
          </div>
          {/* Progress */}
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${urgency.bar}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Right: claim badge + actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <ClaimBadge req={req} />
          <div className="flex items-center gap-1.5">

            {/* Contact requester */}
            {contactPhone && (
              <div className="relative">
                <button onClick={() => setShowCallMenu(!showCallMenu)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                  <Phone className="h-3.5 w-3.5" /> Client
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showCallMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <a href={`tel:${contactPhone}`} onClick={() => setShowCallMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                      <Phone className="h-4 w-4 text-blue-600" /> Appel téléphonique
                    </a>
                    <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" onClick={() => setShowCallMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100">
                      <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Delete (unclaimed only) */}
            {isSalesPerson && req.claimStatus === 'unclaimed' && (
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" />
                {deleting ? '...' : 'Suppr.'}
              </button>
            )}

            {/* Claim / Release */}
            {isSalesPerson && req.claimStatus !== 'fulfilled' && (
              isMyClaim ? (
                <button onClick={handleRelease} disabled={releasing}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50">
                  <Unlock className="h-3.5 w-3.5" /> {releasing ? '...' : 'Libérer'}
                </button>
              ) : !isLocked ? (
                <button onClick={handleClaim} disabled={claiming}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
                  <Lock className="h-3.5 w-3.5" /> {claiming ? '...' : 'Prendre'}
                </button>
              ) : (
                <span className="text-xs text-gray-400 italic">Pris par {req.claimedBy?.firstName}</span>
              )
            )}

            {/* Expand */}
            <button onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 pb-5 pt-4 space-y-4">

          {/* Three-actor chain — always visible */}
          <ThreeActorSummary req={req} />

          {/* Requester details */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-gray-900">Demandeur</p>
              {req.createdBySalesperson && (
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">Entré par agent</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">Nom</p>
                <p className="text-sm font-semibold text-gray-900">
                  {req.clientName || (requester ? `${requester.firstName} ${requester.lastName}` : '—')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Téléphone</p>
                <p className="text-sm font-semibold text-gray-900">{contactPhone || '—'}</p>
              </div>
              {requester?.email && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-gray-700">{requester.email}</p>
                </div>
              )}
            </div>
            {req.submittedBy && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-purple-500" />
                <p className="text-xs text-gray-500">
                  Soumis par <span className="font-semibold text-purple-600">{req.submittedBy.firstName} {req.submittedBy.lastName}</span>
                </p>
              </div>
            )}
          </div>

          {/* Agent working on it */}
          {req.claimStatus === 'in_progress' && req.claimedBy && (
            <div className={`rounded-xl p-3 border flex items-start gap-3 ${isMyClaim ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
              <UserCheck className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isMyClaim ? 'text-blue-600' : 'text-amber-600'}`} />
              <div className="flex-1">
                <p className={`text-xs font-bold mb-1 ${isMyClaim ? 'text-blue-700' : 'text-amber-700'}`}>
                  {isMyClaim ? '✅ Vous gérez cette demande' : `⚠️ Agent: ${req.claimedBy.firstName} ${req.claimedBy.lastName}`}
                </p>
                {!isMyClaim && req.claimedBy.phoneNumber && (
                  <div className="flex gap-2 mb-1.5">
                    <a href={`tel:${req.claimedBy.phoneNumber}`} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg">
                      <Phone className="h-3 w-3" /> Contacter
                    </a>
                    <a href={`https://wa.me/${req.claimedBy.phoneNumber.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg">
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </a>
                  </div>
                )}
                <p className={`text-xs font-medium ${hoursRemaining(req.claimExpiresAt) < 12 ? 'text-red-600' : 'text-gray-500'}`}>
                  <Timer className="h-3 w-3 inline mr-1" />
                  {hoursRemaining(req.claimExpiresAt)}h restantes avant libération automatique
                </p>
              </div>
            </div>
          )}

          {/* Link fulfiller panel — only when claimed by me or CEO/admin */}
          {isSalesPerson && (isMyClaim || req.claimStatus !== 'in_progress') && req.claimStatus !== 'fulfilled' && (
            <LinkFulfillerPanel req={req} onRefresh={onRefresh} />
          )}

          {/* Request specifics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-lg p-2.5 border border-gray-100 text-center">
              <p className="text-xs text-gray-400">Dans le système</p>
              <p className="text-sm font-bold text-gray-800">{Math.floor((Date.now() - new Date(req.createdAt)) / 86400000)}j</p>
            </div>
            {req.bedrooms > 0 && (
              <div className="bg-white rounded-lg p-2.5 border border-gray-100 text-center">
                <p className="text-xs text-gray-400">Chambres</p>
                <p className="text-sm font-bold text-gray-800 flex items-center justify-center gap-1">
                  <Bed className="h-3.5 w-3.5 text-blue-500" /> {req.bedrooms}
                </p>
              </div>
            )}
            <div className="bg-white rounded-lg p-2.5 border border-gray-100 text-center">
              <p className="text-xs text-gray-400">Expire le</p>
              <p className="text-sm font-bold text-gray-800">
                {req.expiresAt ? new Date(req.expiresAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' }) : '—'}
              </p>
            </div>
          </div>

          {/* Locations */}
          {req.locations?.length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Localisations souhaitées</p>
              {req.locations.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                  {[l.commune, l.ville, l.province].filter(Boolean).join(', ')}
                </div>
              ))}
            </div>
          )}

          {req.description && (
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Notes du client</p>
              <p className="text-sm text-gray-700">{req.description}</p>
            </div>
          )}

          {/* Final actions */}
          {isSalesPerson && isMyClaim && req.claimStatus === 'in_progress' && (
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={handleRelease} disabled={releasing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50">
                <Unlock className="h-3.5 w-3.5" /> {releasing ? '...' : 'Libérer'}
              </button>
              <button onClick={handleFulfill} disabled={fulfilling}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
                <CheckCircle className="h-3.5 w-3.5" /> {fulfilling ? '...' : 'Marquer traitée'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Agent Submit Modal ───────────────────────────────────────────────────────

const EMPTY_AGENT_FORM = {
  typeOfProperty:'', listingType:'', timeframe:'',
  bedrooms:'', description:'', currency:'USD',
  budgetMin:'', budgetMax:'',
  locations:[{province:'',provinceId:'',ville:'',villeId:'',commune:''}],
  clientName:'', clientPhone:'', clientUserId:'',
};

const AgentSubmitModal = ({ onClose, onSave }) => {
  const [form,    setForm]    = useState({ ...EMPTY_AGENT_FORM });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [useExisting, setUseExisting] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const updateLocation = (i, updated) => {
    setForm(f => { const locs = [...f.locations]; locs[i] = updated; return { ...f, locations: locs }; });
  };

  const handleSave = async () => {
    if (!form.typeOfProperty) return setError('Choisissez un type de bien.');
    if (!form.listingType)    return setError('Choisissez louer / vendre / journalier.');
    if (!form.timeframe)      return setError('Choisissez la durée.');
    if (!form.clientPhone && !selectedClient) return setError('Le numéro du client est obligatoire.');
    const validLocs = form.locations.filter(l => l.province && l.ville && l.commune)
      .map(l => ({ province: l.province, ville: l.ville, commune: l.commune }));
    if (validLocs.length === 0) return setError('Remplissez au moins une localisation complète.');
    setError('');
    try {
      setSaving(true);
      await apiClient.post('/property-requests/agent-submit', {
        typeOfProperty: form.typeOfProperty,
        listingType:    form.listingType,
        timeframe:      form.timeframe,
        bedrooms:       form.bedrooms ? Number(form.bedrooms) : null,
        description:    form.description || null,
        budget:         { min: form.budgetMin ? Number(form.budgetMin) : null, max: form.budgetMax ? Number(form.budgetMax) : null, currency: form.currency },
        locations:      validLocs,
        clientUserId:   selectedClient?._id || undefined,
        clientName:     selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : form.clientName || undefined,
        clientPhone:    selectedClient?.phoneNumber || form.clientPhone,
      });
      onSave();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la soumission.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Soumettre une demande client</h2>
            <p className="text-sm text-purple-600 font-medium mt-0.5">📋 Le client a appelé — entrez sa demande</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          {/* Client identification */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-purple-800">Identification du client demandeur</p>

            {/* Toggle */}
            <div className="flex gap-2">
              <button onClick={() => { setUseExisting(false); setSelectedClient(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${!useExisting ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                Nouveau client
              </button>
              <button onClick={() => setUseExisting(true)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${useExisting ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                Client existant (DB)
              </button>
            </div>

            {useExisting ? (
              <>
                <UserSearchWidget
                  placeholder="Rechercher le client par nom, tél, email..."
                  onSelect={setSelectedClient}
                  selectedUser={selectedClient}
                  onClear={() => setSelectedClient(null)}
                  accentColor="purple"
                />
                {!selectedClient && (
                  <p className="text-xs text-purple-600">Le client sera lié à son compte existant</p>
                )}
              </>
            ) : (
              <>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nom complet du client"
                  value={form.clientName} onChange={e => set('clientName', e.target.value)} />
                <p className="text-xs text-purple-600">Un compte temporaire sera créé automatiquement</p>
              </>
            )}

            <input className="w-full border border-purple-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              placeholder="📞 Numéro de téléphone *"
              value={selectedClient?.phoneNumber || form.clientPhone}
              readOnly={!!selectedClient}
              onChange={e => set('clientPhone', e.target.value)} />
          </div>

          {/* Property type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type de bien *</label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.filter(t => t.value).map(t => (
                <button key={t.value} onClick={() => set('typeOfProperty', t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${form.typeOfProperty === t.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listing type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction *</label>
            <div className="flex gap-2">
              {LISTING_TYPES.filter(t => t.value).map(t => (
                <button key={t.value} onClick={() => set('listingType', t.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${form.listingType === t.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Durée *</label>
            <div className="flex gap-2 flex-wrap">
              {[{v:'1_week',l:'1 sem.'},{v:'2_weeks',l:'2 sem.'},{v:'1_month',l:'1 mois'},{v:'2_months',l:'2 mois'},{v:'3_months',l:'3 mois'}].map(t => (
                <button key={t.v} onClick={() => set('timeframe', t.v)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${form.timeframe === t.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Budget</label>
            <div className="flex gap-2 items-center">
              <select className="border border-gray-200 rounded-lg px-2 py-2 text-sm" value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option>USD</option><option>CDF</option>
              </select>
              <input type="number" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Min" value={form.budgetMin} onChange={e => set('budgetMin', e.target.value)} />
              <span className="text-gray-400">—</span>
              <input type="number" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Max" value={form.budgetMax} onChange={e => set('budgetMax', e.target.value)} />
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Localisations * <span className="text-gray-400 font-normal">(max 3)</span></label>
            {form.locations.map((loc, i) => (
              <LocationSelector key={i} index={i} value={loc} onChange={updated => updateLocation(i, updated)}
                onRemove={form.locations.length > 1 ? () => set('locations', form.locations.filter((_, idx) => idx !== i)) : undefined} />
            ))}
            {form.locations.length < 3 && (
              <button onClick={() => set('locations', [...form.locations, {province:'',provinceId:'',ville:'',villeId:'',commune:''}])}
                className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:text-blue-700">
                + Ajouter une localisation
              </button>
            )}
          </div>

          {/* Bedrooms + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chambres</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: 2"
                value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Détails supplémentaires..."
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Annuler</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-60">
            {saving ? 'Soumission...' : '📋 Soumettre pour le client'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PropertyRequestsPage = () => {
  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [total,       setTotal]       = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [activeTab,   setActiveTab]   = useState('');

  const currentUser   = apiHelpers.getCurrentUser();
  const isSalesPerson = apiHelpers.isSalesPerson();
  const currentSPId   = currentUser?._id || currentUser?.id;

  const [filters, setFilters] = useState({
    typeOfProperty: '', listingType: '', commune: '', province: '',
    sort: 'expiring', budgetMin: '', budgetMax: '', currency: 'USD',
  });

  const fetchRequests = useCallback(async (p = 1, f = filters, tab = activeTab) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('limit', '20');
      params.set('status', 'active');
      if (f.typeOfProperty) params.set('typeOfProperty', f.typeOfProperty);
      if (f.listingType)    params.set('listingType',    f.listingType);
      if (f.commune)        params.set('commune',        f.commune);
      if (f.province)       params.set('province',       f.province);
      if (f.budgetMin)      params.set('budgetMin',      f.budgetMin);
      if (f.budgetMax)      params.set('budgetMax',      f.budgetMax);
      if (f.budgetMin || f.budgetMax) params.set('currency', f.currency);
      if (tab)              params.set('claimStatus',    tab);
      if (tab === 'fulfilled') params.set('includeDeleted', 'true');

      const res  = await apiClient.get(`/property-requests?${params.toString()}`);
      let data   = res.data?.data || [];

      if (f.sort === 'expiring')    data = [...data].sort((a,b) => getDaysLeft(a.expiresAt) - getDaysLeft(b.expiresAt));
      else if (f.sort === 'newest') data = [...data].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      else if (f.sort === 'oldest') data = [...data].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

      setRequests(data);
      setTotalPages(res.data?.pages || 1);
      setTotal(res.data?.total || data.length);
      setPage(p);
    } catch (e) { console.error('PropertyRequestsPage:', e); }
    finally { setLoading(false); }
  }, [filters, activeTab]);

  useEffect(() => { fetchRequests(1, filters, activeTab); }, []);

  const handleTabChange = (tab) => { setActiveTab(tab); fetchRequests(1, filters, tab); };
  const applyFilters    = () => { fetchRequests(1, filters, activeTab); setShowFilters(false); };
  const resetFilters    = () => {
    const clean = { typeOfProperty:'', listingType:'', commune:'', province:'', sort:'expiring', budgetMin:'', budgetMax:'', currency:'USD' };
    setFilters(clean); fetchRequests(1, clean, activeTab); setShowFilters(false);
  };

  const activeFilterCount = [filters.typeOfProperty, filters.listingType, filters.commune, filters.province, filters.budgetMin, filters.budgetMax].filter(Boolean).length;
  const urgent    = requests.filter(r => getDaysLeft(r.expiresAt) <= 7).length;
  const inProg    = requests.filter(r => r.claimStatus === 'in_progress').length;
  const unclaim   = requests.filter(r => r.claimStatus === 'unclaimed').length;
  const myClaims  = requests.filter(r => r.claimedBy && String(r.claimedBy._id||r.claimedBy) === String(currentSPId)).length;
  const linked    = requests.filter(r => r.fulfilledByUser).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{loading ? 'Chargement...' : `${total} demande${total !== 1 ? 's' : ''} active${total !== 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {isSalesPerson && (
            <button onClick={() => setShowAgentModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700">
              <Users className="h-4 w-4" /> Nouvelle demande client
            </button>
          )}
          <button onClick={() => fetchRequests(1, filters, activeTab)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && requests.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total',         value: total,    icon: Users,         color: 'blue' },
            { label: 'Urgentes ≤7j',  value: urgent,   icon: AlertTriangle, color: 'red' },
            { label: 'En cours',      value: inProg,   icon: Clock,         color: 'amber' },
            { label: 'Disponibles',   value: unclaim,  icon: Unlock,        color: 'green' },
            { label: 'Fournisseurs liés', value: linked, icon: Link2,       color: 'teal' },
          ].map(s => {
            const Icon = s.icon;
            const cls = {
              blue:  ['border-blue-200',  'bg-blue-50',  'text-blue-600'],
              red:   ['border-red-200',   'bg-red-50',   'text-red-600'],
              amber: ['border-amber-200', 'bg-amber-50', 'text-amber-600'],
              green: ['border-green-200', 'bg-green-50', 'text-green-600'],
              teal:  ['border-teal-200',  'bg-teal-50',  'text-teal-600'],
            }[s.color];
            return (
              <div key={s.label} className={`bg-white border rounded-xl p-3 flex items-center gap-3 ${cls[0]}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cls[1]} ${cls[2]}`}>
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {CLAIM_STATUS_TABS.map(tab => (
          <button key={tab.value} onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === tab.value ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <select className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.sort} onChange={e => { const f = {...filters, sort:e.target.value}; setFilters(f); fetchRequests(1,f,activeTab); }}>
          {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${activeFilterCount > 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
          <SlidersHorizontal className="h-4 w-4" /> Filtres
          {activeFilterCount > 0 && <span className="w-5 h-5 bg-white text-blue-600 rounded-full text-xs font-bold flex items-center justify-center">{activeFilterCount}</span>}
        </button>
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium">
            <X className="h-3.5 w-3.5" /> Effacer
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Filtrer les demandes</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type de bien</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={filters.typeOfProperty} onChange={e => setFilters(f => ({...f, typeOfProperty:e.target.value}))}>
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Transaction</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={filters.listingType} onChange={e => setFilters(f => ({...f, listingType:e.target.value}))}>
                {LISTING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Commune</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Ex: Gombe..." value={filters.commune} onChange={e => setFilters(f => ({...f, commune:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Province</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Ex: Kinshasa..." value={filters.province} onChange={e => setFilters(f => ({...f, province:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Budget min</label>
              <div className="flex gap-1">
                <select className="border border-gray-200 rounded-xl px-2 py-2.5 text-sm" value={filters.currency} onChange={e => setFilters(f => ({...f, currency:e.target.value}))}>
                  <option>USD</option><option>CDF</option>
                </select>
                <input type="number" className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="0" value={filters.budgetMin} onChange={e => setFilters(f => ({...f, budgetMin:e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Budget max</label>
              <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="∞" value={filters.budgetMax} onChange={e => setFilters(f => ({...f, budgetMax:e.target.value}))} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button onClick={resetFilters} className="px-4 py-2 text-sm text-gray-500 font-medium">Réinitialiser</button>
            <button onClick={applyFilters} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">Appliquer</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-gray-200">
          <Home className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">Aucune demande trouvée</p>
          <p className="text-sm text-gray-400 mt-1">{activeFilterCount > 0 ? 'Modifiez vos filtres.' : 'Les demandes apparaîtront ici.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <RequestRow key={req._id} req={req} onRefresh={() => fetchRequests(page, filters, activeTab)}
              currentSalesPersonId={currentSPId} isSalesPerson={isSalesPerson} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => fetchRequests(page-1, filters, activeTab)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">Précédent</button>
          <span className="text-sm text-gray-500 px-3">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => fetchRequests(page+1, filters, activeTab)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">Suivant</button>
        </div>
      )}

      {showAgentModal && (
        <AgentSubmitModal onClose={() => setShowAgentModal(false)}
          onSave={() => { setShowAgentModal(false); fetchRequests(1, filters, activeTab); }} />
      )}
    </div>
  );
};

export default PropertyRequestsPage;
