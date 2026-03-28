import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, X, Phone, MessageCircle, MapPin, Home,
  Clock, ChevronDown, ChevronUp, RefreshCw, Trash2,
  CheckCircle, AlertCircle, SlidersHorizontal, Users,
  UserCheck, Unlock, Lock, Timer, AlertTriangle,
  User, Link2, UserPlus, ArrowRight, Bed,
} from 'lucide-react';
import apiClient from '../../services/api';
import { apiHelpers } from '../../services/api';
import LocationSelector from './LocationSelector';
import './PropertyRequestsPage.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'apartment', label: 'Appartement' }, { value: 'house', label: 'Maison' },
  { value: 'studio',    label: 'Studio' },       { value: 'villa', label: 'Villa' },
  { value: 'office',    label: 'Bureau' },        { value: 'land',  label: 'Terrain' },
  { value: 'shop',      label: 'Boutique' },      { value: 'warehouse', label: 'Entrepôt' },
  { value: 'plot',      label: 'Parcelle' },      { value: 'compound',  label: 'Complexe' },
];

const LISTING_TYPES = [
  { value: '',      label: 'Tout' },
  { value: 'rent',  label: 'À louer' },
  { value: 'sale',  label: 'À vendre' },
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

// Returns a colour key: 'red' | 'orange' | 'blue' | 'green'
const getUrgencyKey = (daysLeft) => {
  if (daysLeft <= 3)  return 'red';
  if (daysLeft <= 7)  return 'orange';
  if (daysLeft <= 14) return 'blue';
  return 'green';
};

const formatBudget = (budget) => {
  if (!budget?.min && !budget?.max) return null;
  return `${budget.currency || 'USD'} ${budget.min?.toLocaleString() || '0'} — ${budget.max?.toLocaleString() || '∞'}`;
};

const timeAgo = (date) => {
  const h = Math.floor((Date.now() - new Date(date)) / 3600000);
  if (h < 1)  return "Il y a moins d'1h";
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
  const sizeClass = { sm: 'ua-sm', md: 'ua-md', lg: 'ua-lg' }[size];
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <div className="user-avatar-wrapper">
      {user?.profileImage
        ? <img src={user.profileImage} alt="" className={`user-avatar-img ${sizeClass}`} />
        : <div className={`user-avatar-initials ${sizeClass}`}>{initials}</div>
      }
      {label && (
        <div>
          <p className="user-avatar-label">{label}</p>
          <p className="user-avatar-name">
            {user ? `${user.firstName} ${user.lastName}` : '—'}
          </p>
          {user?.phoneNumber && <p className="user-avatar-phone">{user.phoneNumber}</p>}
        </div>
      )}
    </div>
  );
};

// ─── Claim Status Badge ───────────────────────────────────────────────────────

const ClaimBadge = ({ req }) => {
  if (req.claimStatus === 'fulfilled') {
    return (
      <span className="claim-badge claim-badge--fulfilled">
        <CheckCircle size={12} /> Traité
      </span>
    );
  }
  if (req.claimStatus === 'in_progress') {
    const hrs = hoursRemaining(req.claimExpiresAt);
    return (
      <span className={`claim-badge ${hrs < 12 ? 'claim-badge--inprog-hot' : 'claim-badge--inprog'}`}>
        <Clock size={12} /> En cours · {hrs}h
      </span>
    );
  }
  return (
    <span className="claim-badge claim-badge--unclaimed">
      <Unlock size={12} /> Disponible
    </span>
  );
};

// ─── User Search Widget ───────────────────────────────────────────────────────

const UserSearchWidget = ({ placeholder, onSelect, selectedUser, onClear, accentColor = 'blue' }) => {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
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

  const inputClass = `user-search-input user-search-input--${accentColor}`;
  const selectedClass = `user-search-selected user-search-selected--${accentColor}`;

  if (selectedUser) {
    return (
      <div className={selectedClass}>
        <UserAvatar user={selectedUser} size="sm" label="Sélectionné" />
        <button className="user-search-clear" onClick={onClear}>
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="user-search-wrapper">
      <div className="user-search-input-wrapper">
        <Search className="user-search-icon" size={16} />
        <input
          className={inputClass}
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && <div className="user-search-spinner" />}
      </div>

      {open && results.length > 0 && (
        <div className="user-search-dropdown">
          {results.map(u => (
            <button
              key={u._id}
              className="user-search-result"
              onClick={() => { onSelect(u); setQuery(''); setOpen(false); setResults([]); }}
            >
              <div className="user-search-result-inner">
                <UserAvatar user={u} size="sm" />
                <div>
                  <p className="user-search-result-name">{u.firstName} {u.lastName}</p>
                  <p className="user-search-result-sub">{u.phoneNumber}{u.email ? ` · ${u.email}` : ''}</p>
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
        notes:  notes || undefined,
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
    <div className="fulfiller-panel">
      <div className="fulfiller-panel-header">
        <div className="fulfiller-panel-icon">
          <Link2 size={14} />
        </div>
        <div>
          <p className="fulfiller-panel-title">Fournisseur potentiel</p>
          <p className="fulfiller-panel-sub">L'utilisateur qui a appelé et peut satisfaire cette demande</p>
        </div>
      </div>

      <div className="fulfiller-panel-body">
        {error && (
          <div className="fulfiller-error">
            <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {alreadyLinked ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="fulfiller-linked-row">
              <UserAvatar user={req.fulfilledByUser} size="md" label="Fournisseur lié" />
              <div className="fulfiller-linked-actions">
                {req.fulfilledByUser?.phoneNumber && (
                  <>
                    <a href={`tel:${req.fulfilledByUser.phoneNumber}`} className="btn btn-blue btn-sm">
                      <Phone size={12} /> Appeler
                    </a>
                    <a
                      href={`https://wa.me/${req.fulfilledByUser.phoneNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank" rel="noreferrer"
                      className="btn btn-green btn-sm"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  </>
                )}
                <button onClick={handleUnlink} disabled={unlinking} className="btn btn-red-outline btn-sm">
                  <X size={12} /> {unlinking ? '...' : 'Délier'}
                </button>
              </div>
            </div>

            {req.fulfillmentNotes && (
              <div className="fulfiller-notes">
                <p className="fulfiller-notes-label">Notes</p>
                <p>{req.fulfillmentNotes}</p>
              </div>
            )}

            {req.fulfillmentLinkedAt && (
              <p className="fulfiller-linked-time">Lié {timeAgo(req.fulfillmentLinkedAt)}</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className="fulfiller-hint">
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
              className="fulfiller-textarea"
              rows={2}
              placeholder="Notes optionnelles (ex: a un appartement à Gombe disponible immédiatement)..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <button
              className="fulfiller-link-btn"
              onClick={handleLink}
              disabled={!selectedUser || linking}
            >
              <Link2 size={16} />
              {linking ? 'Liaison...' : 'Lier comme fournisseur'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Three-Actor Summary ──────────────────────────────────────────────────────

const ThreeActorSummary = ({ req }) => {
  const requester = req.clientUser || req.requestedBy;
  const agent     = req.claimedBy;
  const fulfiller = req.fulfilledByUser;

  return (
    <div className="three-actor">
      <p className="three-actor-title">Chaîne de la demande</p>
      <div className="three-actor-chain">

        {/* Requester */}
        <div className="actor-block">
          <div className="actor-avatar actor-avatar--requester">
            {requester?.profileImage
              ? <img src={requester.profileImage} alt="" />
              : <span>{requester?.firstName?.[0] || '?'}</span>
            }
          </div>
          <p className="actor-name">{requester ? `${requester.firstName} ${requester.lastName}` : '—'}</p>
          <p className="actor-role actor-role--requester">Demandeur</p>
          {requester?.phoneNumber && <p className="actor-phone">{requester.phoneNumber}</p>}
        </div>

        {/* Connector with Agent */}
        <div className="actor-connector">
          <ArrowRight size={16} />
          <div className="actor-connector-inner">
            <div className="actor-connector-mini-avatar">
              <span>{agent?.firstName?.[0] || 'A'}</span>
            </div>
            <p className="actor-connector-role">Agent</p>
            {agent && <p className="actor-connector-name">{agent.firstName}</p>}
          </div>
          <ArrowRight size={16} />
        </div>

        {/* Fulfiller */}
        <div className="actor-block">
          <div className={`actor-avatar ${fulfiller ? 'actor-avatar--fulfiller' : 'actor-avatar--empty'}`}>
            {fulfiller?.profileImage
              ? <img src={fulfiller.profileImage} alt="" />
              : fulfiller
                ? <span>{fulfiller.firstName?.[0]}</span>
                : <UserPlus size={16} style={{ color: '#9ca3af' }} />
            }
          </div>
          <p className="actor-name">{fulfiller ? `${fulfiller.firstName} ${fulfiller.lastName}` : 'À lier'}</p>
          <p className={`actor-role ${fulfiller ? 'actor-role--fulfiller' : 'actor-role--empty'}`}>Fournisseur</p>
          {fulfiller?.phoneNumber && <p className="actor-phone">{fulfiller.phoneNumber}</p>}
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
  const urgency   = getUrgencyKey(daysLeft);
  const totalDays = { '1_week': 7, '2_weeks': 14, '1_month': 30, '2_months': 60, '3_months': 90 }[req.timeframe] || 30;
  const pct       = Math.min(100, (daysLeft / totalDays) * 100);

  const propLabel = PROPERTY_TYPES.find(p => p.value === req.typeOfProperty)?.label || req.typeOfProperty;
  const listLabel = LISTING_TYPES.find(l => l.value === req.listingType)?.label    || req.listingType;
  const communes  = req.locations?.map(l => l.commune).filter(Boolean).join(', ')  || '—';
  const budget    = formatBudget(req.budget);

  const isMyClaim = req.claimedBy && String(req.claimedBy._id || req.claimedBy) === String(currentSalesPersonId);
  const isLocked  = req.claimStatus === 'in_progress' && !isMyClaim;

  const requester    = req.clientUser || req.requestedBy;
  const contactPhone = req.clientPhone || requester?.phoneNumber;
  const waPhone      = contactPhone?.replace(/[^0-9]/g, '');

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
    <div className={`request-row request-row--${urgency}`}>

      {/* ── Main row ── */}
      <div className="request-row-main">

        {/* Urgency badge */}
        <div className={`urgency-badge urgency-badge--${urgency}`}>
          <span className={`urgency-days urgency-days--${urgency}`}>{daysLeft}</span>
          <span className={`urgency-label urgency-label--${urgency}`}>jours</span>
        </div>

        {/* Info */}
        <div className="request-info">
          <div className="request-info-top">
            <span className="request-prop-type">{propLabel}</span>
            <span className="request-separator">·</span>
            <span className="request-listing-type">{listLabel}</span>
            {budget && (
              <>
                <span className="request-separator">·</span>
                <span className="request-budget">{budget}</span>
              </>
            )}
            {req.createdBySalesperson && (
              <span className="badge badge--purple">
                <Users size={12} /> Via agent
              </span>
            )}
            {req.fulfilledByUser && (
              <span className="badge badge--green">
                <Link2 size={12} /> Fournisseur lié
              </span>
            )}
          </div>

          <div className="request-info-meta">
            <div className="meta-location">
              <MapPin size={12} style={{ flexShrink: 0 }} />
              <span>{communes}</span>
            </div>
            <span className="meta-time">{timeAgo(req.createdAt)}</span>
            {requester && (
              <div className="mini-avatar">
                <div className="mini-avatar-circle">
                  <span>{requester.firstName?.[0]}</span>
                </div>
                <span className="mini-avatar-name">{requester.firstName} {requester.lastName}</span>
              </div>
            )}
          </div>

          <div className="progress-track">
            <div className={`progress-bar progress-bar--${urgency}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Right: claim badge + actions */}
        <div className="request-actions">
          <ClaimBadge req={req} />

          <div className="request-action-row">

            {/* Contact requester */}
            {contactPhone && (
              <div className="contact-menu-wrapper">
                <button
                  className="btn btn-blue btn-sm"
                  onClick={() => setShowCallMenu(!showCallMenu)}
                >
                  <Phone size={14} /> Client <ChevronDown size={12} />
                </button>
                {showCallMenu && (
                  <div className="contact-dropdown">
                    <a href={`tel:${contactPhone}`} onClick={() => setShowCallMenu(false)}>
                      <Phone size={16} style={{ color: '#2563eb' }} /> Appel téléphonique
                    </a>
                    <a
                      href={`https://wa.me/${waPhone}`}
                      target="_blank" rel="noreferrer"
                      onClick={() => setShowCallMenu(false)}
                    >
                      <MessageCircle size={16} style={{ color: '#16a34a' }} /> WhatsApp
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Delete (unclaimed only) */}
            {isSalesPerson && req.claimStatus === 'unclaimed' && (
              <button className="btn btn-red-outline btn-sm" onClick={handleDelete} disabled={deleting}>
                <Trash2 size={14} /> {deleting ? '...' : 'Suppr.'}
              </button>
            )}

            {/* Claim / Release */}
            {isSalesPerson && req.claimStatus !== 'fulfilled' && (
              isMyClaim ? (
                <button className="btn btn-gray-light btn-sm" onClick={handleRelease} disabled={releasing}>
                  <Unlock size={14} /> {releasing ? '...' : 'Libérer'}
                </button>
              ) : !isLocked ? (
                <button className="btn btn-green btn-sm" onClick={handleClaim} disabled={claiming}>
                  <Lock size={14} /> {claiming ? '...' : 'Prendre'}
                </button>
              ) : (
                <span className="locked-label">Pris par {req.claimedBy?.firstName}</span>
              )
            )}

            {/* Expand toggle */}
            <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded section ── */}
      {expanded && (
        <div className="request-expanded">

          {/* Three-actor chain */}
          <ThreeActorSummary req={req} />

          {/* Requester details */}
          <div className="info-card">
            <div className="info-card-header">
              <div className="info-card-icon info-card-icon--blue">
                <User size={14} />
              </div>
              <p className="info-card-title">Demandeur</p>
              {req.createdBySalesperson && (
                <span className="badge badge--purple">Entré par agent</span>
              )}
            </div>
            <div className="info-grid">
              <div>
                <p className="info-label">Nom</p>
                <p className="info-value">
                  {req.clientName || (requester ? `${requester.firstName} ${requester.lastName}` : '—')}
                </p>
              </div>
              <div>
                <p className="info-label">Téléphone</p>
                <p className="info-value">{contactPhone || '—'}</p>
              </div>
              {requester?.email && (
                <div className="info-grid--full">
                  <p className="info-label">Email</p>
                  <p className="info-value" style={{ fontWeight: 400 }}>{requester.email}</p>
                </div>
              )}
            </div>
            {req.submittedBy && (
              <div className="info-submitted-by">
                <Users size={14} style={{ color: '#a855f7' }} />
                <p>
                  Soumis par{' '}
                  <span className="agent-name">{req.submittedBy.firstName} {req.submittedBy.lastName}</span>
                </p>
              </div>
            )}
          </div>

          {/* Agent currently handling */}
          {req.claimStatus === 'in_progress' && req.claimedBy && (
            <div className={`agent-banner ${isMyClaim ? 'agent-banner--mine' : 'agent-banner--other'}`}>
              <UserCheck
                size={20}
                style={{ flexShrink: 0, marginTop: 2, color: isMyClaim ? '#2563eb' : '#d97706' }}
              />
              <div style={{ flex: 1 }}>
                <p className={`agent-banner-title ${isMyClaim ? 'agent-banner-title--mine' : 'agent-banner-title--other'}`}>
                  {isMyClaim
                    ? '✅ Vous gérez cette demande'
                    : `⚠️ Agent: ${req.claimedBy.firstName} ${req.claimedBy.lastName}`}
                </p>
                {!isMyClaim && req.claimedBy.phoneNumber && (
                  <div className="agent-banner-actions">
                    <a href={`tel:${req.claimedBy.phoneNumber}`} className="btn btn-blue btn-xs">
                      <Phone size={12} /> Contacter
                    </a>
                    <a
                      href={`https://wa.me/${req.claimedBy.phoneNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank" rel="noreferrer"
                      className="btn btn-green btn-xs"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  </div>
                )}
                <p className={`agent-timer ${hoursRemaining(req.claimExpiresAt) < 12 ? 'agent-timer--urgent' : 'agent-timer--normal'}`}>
                  <Timer size={12} />
                  {hoursRemaining(req.claimExpiresAt)}h restantes avant libération automatique
                </p>
              </div>
            </div>
          )}

          {/* Link fulfiller panel */}
          {isSalesPerson && (isMyClaim || req.claimStatus !== 'in_progress') && req.claimStatus !== 'fulfilled' && (
            <LinkFulfillerPanel req={req} onRefresh={onRefresh} />
          )}

          {/* Mini stats */}
          <div className="mini-stats-row">
            <div className="mini-stat">
              <p className="mini-stat-label">Dans le système</p>
              <p className="mini-stat-value">{Math.floor((Date.now() - new Date(req.createdAt)) / 86400000)}j</p>
            </div>
            {req.bedrooms > 0 && (
              <div className="mini-stat">
                <p className="mini-stat-label">Chambres</p>
                <p className="mini-stat-value">
                  <Bed size={14} style={{ color: '#3b82f6' }} /> {req.bedrooms}
                </p>
              </div>
            )}
            <div className="mini-stat">
              <p className="mini-stat-label">Expire le</p>
              <p className="mini-stat-value">
                {req.expiresAt
                  ? new Date(req.expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                  : '—'}
              </p>
            </div>
          </div>

          {/* Locations */}
          {req.locations?.length > 0 && (
            <div className="locations-block">
              <p className="locations-block-label">Localisations souhaitées</p>
              {req.locations.map((l, i) => (
                <div key={i} className="location-item">
                  <span className="location-num">{i + 1}</span>
                  {[l.commune, l.ville, l.province].filter(Boolean).join(', ')}
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {req.description && (
            <div className="desc-block">
              <p className="desc-block-label">Notes du client</p>
              <p>{req.description}</p>
            </div>
          )}

          {/* Final actions */}
          {isSalesPerson && isMyClaim && req.claimStatus === 'in_progress' && (
            <div className="final-actions">
              <button className="btn btn-gray-light btn-sm" onClick={handleRelease} disabled={releasing}>
                <Unlock size={14} /> {releasing ? '...' : 'Libérer'}
              </button>
              <button className="btn btn-green btn-sm" onClick={handleFulfill} disabled={fulfilling}>
                <CheckCircle size={14} /> {fulfilling ? '...' : 'Marquer traitée'}
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
  typeOfProperty: '', listingType: '', timeframe: '',
  bedrooms: '', description: '', currency: 'USD',
  budgetMin: '', budgetMax: '',
  locations: [{ province: '', provinceId: '', ville: '', villeId: '', commune: '' }],
  clientName: '', clientPhone: '', clientUserId: '',
};

const AgentSubmitModal = ({ onClose, onSave }) => {
  const [form,           setForm]           = useState({ ...EMPTY_AGENT_FORM });
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [useExisting,    setUseExisting]    = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const updateLocation = (i, updated) => {
    setForm(f => { const locs = [...f.locations]; locs[i] = updated; return { ...f, locations: locs }; });
  };

  const handleSave = async () => {
    if (!form.typeOfProperty) return setError('Choisissez un type de bien.');
    if (!form.listingType)    return setError('Choisissez louer / vendre / journalier.');
    if (!form.timeframe)      return setError('Choisissez la durée.');
    if (!form.clientPhone && !selectedClient) return setError('Le numéro du client est obligatoire.');
    const validLocs = form.locations
      .filter(l => l.province && l.ville && l.commune)
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
        budget: {
          min:      form.budgetMin ? Number(form.budgetMin) : null,
          max:      form.budgetMax ? Number(form.budgetMax) : null,
          currency: form.currency,
        },
        locations:    validLocs,
        clientUserId: selectedClient?._id || undefined,
        clientName:   selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : form.clientName || undefined,
        clientPhone:  selectedClient?.phoneNumber || form.clientPhone,
      });
      onSave();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la soumission.');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Soumettre une demande client</h2>
            <p className="modal-header-sub">📋 Le client a appelé — entrez sa demande</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          {/* Client identification */}
          <div className="client-section">
            <p className="client-section-title">Identification du client demandeur</p>

            <div className="client-toggle">
              <button
                className={`client-toggle-btn ${!useExisting ? 'client-toggle-btn--active' : ''}`}
                onClick={() => { setUseExisting(false); setSelectedClient(null); }}
              >
                Nouveau client
              </button>
              <button
                className={`client-toggle-btn ${useExisting ? 'client-toggle-btn--active' : ''}`}
                onClick={() => setUseExisting(true)}
              >
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
                  <p className="client-hint">Le client sera lié à son compte existant</p>
                )}
              </>
            ) : (
              <>
                <input
                  className="client-input"
                  placeholder="Nom complet du client"
                  value={form.clientName}
                  onChange={e => set('clientName', e.target.value)}
                />
                <p className="client-hint">Un compte temporaire sera créé automatiquement</p>
              </>
            )}

            <input
              className="client-phone-input"
              placeholder="📞 Numéro de téléphone *"
              value={selectedClient?.phoneNumber || form.clientPhone}
              readOnly={!!selectedClient}
              onChange={e => set('clientPhone', e.target.value)}
            />
          </div>

          {/* Property type */}
          <div className="modal-field">
            <label className="modal-label">Type de bien *</label>
            <div className="chip-group">
              {PROPERTY_TYPES.filter(t => t.value).map(t => (
                <button
                  key={t.value}
                  className={`chip ${form.typeOfProperty === t.value ? 'chip--active' : ''}`}
                  onClick={() => set('typeOfProperty', t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listing type */}
          <div className="modal-field">
            <label className="modal-label">Transaction *</label>
            <div className="chip-group">
              {LISTING_TYPES.filter(t => t.value).map(t => (
                <button
                  key={t.value}
                  className={`chip-full ${form.listingType === t.value ? 'chip-full--active' : ''}`}
                  onClick={() => set('listingType', t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div className="modal-field">
            <label className="modal-label">Durée *</label>
            <div className="chip-group">
              {[
                { v: '1_week', l: '1 sem.' }, { v: '2_weeks', l: '2 sem.' },
                { v: '1_month', l: '1 mois' }, { v: '2_months', l: '2 mois' },
                { v: '3_months', l: '3 mois' },
              ].map(t => (
                <button
                  key={t.v}
                  className={`chip ${form.timeframe === t.v ? 'chip--active' : ''}`}
                  onClick={() => set('timeframe', t.v)}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="modal-field">
            <label className="modal-label">Budget</label>
            <div className="budget-row">
              <select className="budget-currency" value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option>USD</option>
                <option>CDF</option>
              </select>
              <input type="number" className="budget-input" placeholder="Min" value={form.budgetMin} onChange={e => set('budgetMin', e.target.value)} />
              <span className="budget-sep">—</span>
              <input type="number" className="budget-input" placeholder="Max" value={form.budgetMax} onChange={e => set('budgetMax', e.target.value)} />
            </div>
          </div>

          {/* Locations */}
          <div className="modal-field">
            <label className="modal-label">
              Localisations * <span style={{ fontWeight: 400, color: '#9ca3af' }}>(max 3)</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {form.locations.map((loc, i) => (
                <LocationSelector
                  key={i}
                  index={i}
                  value={loc}
                  onChange={updated => updateLocation(i, updated)}
                  onRemove={form.locations.length > 1
                    ? () => set('locations', form.locations.filter((_, idx) => idx !== i))
                    : undefined}
                />
              ))}
              {form.locations.length < 3 && (
                <button
                  className="add-location-btn"
                  onClick={() => set('locations', [...form.locations, { province: '', provinceId: '', ville: '', villeId: '', commune: '' }])}
                >
                  + Ajouter une localisation
                </button>
              )}
            </div>
          </div>

          {/* Bedrooms + Notes */}
          <div className="modal-grid-2">
            <div className="modal-field">
              <label className="modal-label">Chambres</label>
              <input
                type="number"
                className="modal-input"
                placeholder="Ex: 2"
                value={form.bedrooms}
                onChange={e => set('bedrooms', e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Notes</label>
              <input
                className="modal-input"
                placeholder="Détails supplémentaires..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>Annuler</button>
          <button className="btn btn-purple" onClick={handleSave} disabled={saving}>
            {saving ? 'Soumission...' : '📋 Soumettre pour le client'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PropertyRequestsPage = () => {
  const [requests,       setRequests]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState(1);
  const [totalPages,     setTotalPages]     = useState(1);
  const [total,          setTotal]          = useState(0);
  const [showFilters,    setShowFilters]    = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [activeTab,      setActiveTab]      = useState('');

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
      params.set('page',   String(p));
      params.set('limit',  '20');
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

      if (f.sort === 'expiring')    data = [...data].sort((a, b) => getDaysLeft(a.expiresAt) - getDaysLeft(b.expiresAt));
      else if (f.sort === 'newest') data = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      else if (f.sort === 'oldest') data = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      setRequests(data);
      setTotalPages(res.data?.pages || 1);
      setTotal(res.data?.total || data.length);
      setPage(p);
    } catch (e) { console.error('PropertyRequestsPage:', e); }
    finally { setLoading(false); }
  }, [filters, activeTab]);

  useEffect(() => { fetchRequests(1, filters, activeTab); }, []); // eslint-disable-line

  const handleTabChange = (tab) => { setActiveTab(tab); fetchRequests(1, filters, tab); };
  const applyFilters    = () => { fetchRequests(1, filters, activeTab); setShowFilters(false); };
  const resetFilters    = () => {
    const clean = { typeOfProperty: '', listingType: '', commune: '', province: '', sort: 'expiring', budgetMin: '', budgetMax: '', currency: 'USD' };
    setFilters(clean); fetchRequests(1, clean, activeTab); setShowFilters(false);
  };

  const activeFilterCount = [
    filters.typeOfProperty, filters.listingType, filters.commune,
    filters.province, filters.budgetMin, filters.budgetMax,
  ].filter(Boolean).length;

  const urgent   = requests.filter(r => getDaysLeft(r.expiresAt) <= 7).length;
  const inProg   = requests.filter(r => r.claimStatus === 'in_progress').length;
  const unclaim  = requests.filter(r => r.claimStatus === 'unclaimed').length;
  const linked   = requests.filter(r => r.fulfilledByUser).length;

  const STATS = [
    { label: 'Total',             value: total,   icon: Users,         color: 'blue' },
    { label: 'Urgentes ≤7j',      value: urgent,  icon: AlertTriangle, color: 'red' },
    { label: 'En cours',          value: inProg,  icon: Clock,         color: 'amber' },
    { label: 'Disponibles',       value: unclaim, icon: Unlock,        color: 'green' },
    { label: 'Fournisseurs liés', value: linked,  icon: Link2,         color: 'teal' },
  ];

  return (
    <div className="prp-page">

      {/* Header */}
      <div className="prp-header">
        <div>
          <h1>Demandes clients</h1>
          <p className="prp-header-subtitle">
            {loading ? 'Chargement...' : `${total} demande${total !== 1 ? 's' : ''} active${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="prp-header-actions">
          {isSalesPerson && (
            <button className="btn btn-purple" onClick={() => setShowAgentModal(true)}>
              <Users size={16} /> Nouvelle demande client
            </button>
          )}
          <button className="btn btn-gray-outline" onClick={() => fetchRequests(1, filters, activeTab)}>
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && requests.length > 0 && (
        <div className="prp-stats-grid">
          {STATS.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`stat-card stat-card--${s.color}`}>
                <div className={`stat-icon stat-icon--${s.color}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="stat-value">{s.value}</p>
                  <p className="stat-label">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="prp-tabs">
        {CLAIM_STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            className={`prp-tab ${activeTab === tab.value ? 'prp-tab--active' : ''}`}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="prp-toolbar">
        <select
          className="prp-sort-select"
          value={filters.sort}
          onChange={e => { const f = { ...filters, sort: e.target.value }; setFilters(f); fetchRequests(1, f, activeTab); }}
        >
          {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <button
          className={`prp-filter-btn ${activeFilterCount > 0 ? 'prp-filter-btn--active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} /> Filtres
          {activeFilterCount > 0 && (
            <span className="prp-filter-badge">{activeFilterCount}</span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button className="prp-clear-btn" onClick={resetFilters}>
            <X size={14} /> Effacer
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="filter-panel">
          <h3>Filtrer les demandes</h3>
          <div className="filter-grid">
            <div className="filter-field">
              <label>Type de bien</label>
              <select className="filter-select" value={filters.typeOfProperty} onChange={e => setFilters(f => ({ ...f, typeOfProperty: e.target.value }))}>
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>Transaction</label>
              <select className="filter-select" value={filters.listingType} onChange={e => setFilters(f => ({ ...f, listingType: e.target.value }))}>
                {LISTING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>Commune</label>
              <input className="filter-input" placeholder="Ex: Gombe..." value={filters.commune} onChange={e => setFilters(f => ({ ...f, commune: e.target.value }))} />
            </div>
            <div className="filter-field">
              <label>Province</label>
              <input className="filter-input" placeholder="Ex: Kinshasa..." value={filters.province} onChange={e => setFilters(f => ({ ...f, province: e.target.value }))} />
            </div>
            <div className="filter-field">
              <label>Budget min</label>
              <div className="filter-budget-row">
                <select className="filter-select" value={filters.currency} onChange={e => setFilters(f => ({ ...f, currency: e.target.value }))}>
                  <option>USD</option><option>CDF</option>
                </select>
                <input type="number" className="filter-input" placeholder="0" value={filters.budgetMin} onChange={e => setFilters(f => ({ ...f, budgetMin: e.target.value }))} />
              </div>
            </div>
            <div className="filter-field">
              <label>Budget max</label>
              <input type="number" className="filter-input" placeholder="∞" value={filters.budgetMax} onChange={e => setFilters(f => ({ ...f, budgetMax: e.target.value }))} />
            </div>
          </div>
          <div className="filter-actions">
            <button className="filter-reset-btn" onClick={resetFilters}>Réinitialiser</button>
            <button className="filter-apply-btn" onClick={applyFilters}>Appliquer</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="prp-loading">
          <div className="spinner" />
        </div>
      ) : requests.length === 0 ? (
        <div className="prp-empty">
          <Home size={48} className="prp-empty-icon" />
          <p>Aucune demande trouvée</p>
          <p>{activeFilterCount > 0 ? 'Modifiez vos filtres.' : 'Les demandes apparaîtront ici.'}</p>
        </div>
      ) : (
        <div className="prp-list">
          {requests.map(req => (
            <RequestRow
              key={req._id}
              req={req}
              onRefresh={() => fetchRequests(page, filters, activeTab)}
              currentSalesPersonId={currentSPId}
              isSalesPerson={isSalesPerson}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="prp-pagination">
          <button
            className="btn btn-gray-outline"
            disabled={page <= 1}
            onClick={() => fetchRequests(page - 1, filters, activeTab)}
          >
            Précédent
          </button>
          <span className="prp-page-label">Page {page} / {totalPages}</span>
          <button
            className="btn btn-gray-outline"
            disabled={page >= totalPages}
            onClick={() => fetchRequests(page + 1, filters, activeTab)}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Agent modal */}
      {showAgentModal && (
        <AgentSubmitModal
          onClose={() => setShowAgentModal(false)}
          onSave={() => { setShowAgentModal(false); fetchRequests(1, filters, activeTab); }}
        />
      )}
    </div>
  );
};

export default PropertyRequestsPage;
