import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Tag, Plus, X, RefreshCw, CheckCircle, XCircle,
  Copy, Check, AlertCircle, Ban, User, Percent, DollarSign, Search,
  TrendingUp, Coins, Loader2,
} from 'lucide-react';
import { promoCodeService } from '../../services/promoCode.service';
import { userService } from '../../services/user.service';

// ─── Constants ────────────────────────────────────────────────────────────────

const DISCOUNT_TYPES = [
  { value: 'percent', label: 'Pourcentage' },
  { value: 'fixed', label: 'Montant fixe (USD)' },
];

const PARTNER_TYPES = [
  { value: 'business_partner', label: 'Partenaire business' },
  { value: 'influencer', label: 'Influenceur' },
  { value: 'affiliate', label: 'Affilié' },
  { value: 'internal', label: 'Interne' },
  { value: 'campaign', label: 'Campagne' },
];

const COMMISSION_TYPES = [
  { value: 'percent', label: 'Pourcentage du montant vendu' },
  { value: 'fixed', label: 'Montant fixe (USD) par utilisation' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDiscount = (promo) => {
  if (promo.discountType === 'percent') return `${promo.discountValue}%`;
  return `$${promo.discountValue}`;
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isExpired = (promo) => promo.expiresAt && new Date(promo.expiresAt) < new Date();

const matchesSearch = (promo, term) => {
  if (!term) return true;
  const t = term.toLowerCase();
  return (
    promo.code?.toLowerCase().includes(t) ||
    promo.partnerName?.toLowerCase().includes(t) ||
    promo.partnerEmail?.toLowerCase().includes(t)
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ promo }) => {
  if (isExpired(promo)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
        <XCircle className="h-3 w-3" /> Expiré
      </span>
    );
  }
  if (!promo.isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
        <Ban className="h-3 w-3" /> Désactivé
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
      <CheckCircle className="h-3 w-3" /> Actif
    </span>
  );
};

// ─── Copyable credentials chip ─────────────────────────────────────────────────
// Note: NO password shown here anymore — the partner logs in with
// their OWN real account password (the one they already use
// everywhere else in the app), which this admin UI never sees or
// generates. Only code + which account it's tied to are shown.

const PartnerCredentialsChip = ({ code, partnerEmail }) => {
  const [copied, setCopied] = useState(false);
  const summary = `Code: ${code}\nCompte: ${partnerEmail}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — fine, details are still visible
    }
  };

  return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
      <div className="flex-1 text-xs text-blue-700">
        <p><span className="font-semibold">Code :</span> {code}</p>
        <p><span className="font-semibold">Compte lié :</span> {partnerEmail}</p>
      </div>
      <button onClick={handleCopy} className="flex-shrink-0 p-1 hover:bg-blue-100 rounded transition-colors" title="Copier">
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-blue-500" />}
      </button>
    </div>
  );
};

// ─── Savings + Commission summary strip ───────────────────────────────────────

const StatsStrip = ({ promo }) => {
  if (!promo.stats || promo.stats.totalRedemptions === 0) {
    return (
      <p className="text-xs text-gray-400 mb-2.5">Aucune utilisation payée pour l'instant</p>
    );
  }
  return (
    <div className="flex items-center gap-4 flex-wrap text-xs mb-2.5">
      <span className="flex items-center gap-1 text-green-700 font-medium">
        <TrendingUp className="h-3.5 w-3.5" />
        Client a économisé : ${promo.stats.totalDiscountAmount.toFixed(2)}
      </span>
      <span className="text-gray-400">sur ${promo.stats.totalOriginalAmount.toFixed(2)} de ventes</span>
      {promo.commissionEnabled && (
        <span className="flex items-center gap-1 text-blue-700 font-semibold">
          <Coins className="h-3.5 w-3.5" />
          Commission due : ${promo.commissionAmount.toFixed(2)}
        </span>
      )}
    </div>
  );
};

// ─── Promo Code Row ────────────────────────────────────────────────────────────

const PromoCodeRow = ({ promo, onRefresh }) => {
  const [deactivating, setDeactivating] = useState(false);

  const handleDeactivate = async () => {
    if (!window.confirm(`Désactiver le code "${promo.code}" ?`)) return;
    try {
      setDeactivating(true);
      await promoCodeService.deactivatePromoCode(promo._id);
      onRefresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeactivating(false);
    }
  };

  const borderColor = isExpired(promo)
    ? 'border-l-gray-300'
    : !promo.isActive
    ? 'border-l-red-400'
    : 'border-l-green-400';

  return (
    <div className={`bg-white border rounded-xl p-4 transition-all hover:shadow-sm border-l-4 ${borderColor}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-mono font-bold text-gray-900 text-sm">{promo.code}</span>
            <StatusBadge promo={promo} />
            {promo.commissionEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700">
                <Coins className="h-3 w-3" />
                {promo.commissionType === 'percent' ? `${promo.commissionValue}% commission` : `$${promo.commissionValue}/utilisation`}
              </span>
            )}
            {promo.createdBy && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-700">
                <User className="h-3 w-3" /> Admin · {promo.createdBy.name}
              </span>
            )}
          </div>
          {promo.partnerName && (
            <p className="text-sm text-gray-500 mb-2">
              {promo.partnerName}
              {promo.partnerType && ` — ${PARTNER_TYPES.find(t => t.value === promo.partnerType)?.label || promo.partnerType}`}
            </p>
          )}
          <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              {promo.discountType === 'percent' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
              {formatDiscount(promo)}
            </span>
            <span>Utilisé {promo.stats?.totalRedemptions ?? 0}{promo.maxRedemptions ? ` / ${promo.maxRedemptions}` : ''} fois</span>
            {promo.expiresAt && <span>Expire le {formatDate(promo.expiresAt)}</span>}
          </div>
          <StatsStrip promo={promo} />
          {promo.partnerEmail && (
            <PartnerCredentialsChip code={promo.code} partnerEmail={promo.partnerEmail} />
          )}
        </div>

        {promo.isActive && !isExpired(promo) && (
          <div className="flex-shrink-0">
            <button onClick={handleDeactivate} disabled={deactivating}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50">
              <Ban className="h-3.5 w-3.5" /> {deactivating ? '...' : 'Désactiver'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Live user search (real DB, 10k+ users) ────────────────────────────────────

const useUserSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await userService.getUsers({ search: query.trim(), limit: 5 });
        setResults(res.success ? (res.users || []) : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  return { query, setQuery, results, searching, clear: () => setResults([]) };
};

const UserSuggestions = ({ results, searching, onSelect }) => {
  if (!searching && results.length === 0) return null;

  return (
    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      {searching ? (
        <div className="flex items-center gap-2 px-3 py-3 text-xs text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Recherche…
        </div>
      ) : (
        results.map((u) => (
          <button
            key={u._id}
            type="button"
            onClick={() => onSelect(u)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
          >
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {u.profileImage ? (
                <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-blue-600">
                  {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{u.firstName} {u.lastName}</p>
              <p className="text-xs text-gray-500 truncate">{u.email}</p>
            </div>
          </button>
        ))
      )}
    </div>
  );
};

// ─── Selected partner card — replaces free-text once a real user is picked ─────

const SelectedPartnerCard = ({ user, onChange }) => (
  <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-lg px-3 py-2.5">
    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
      {user.profileImage ? (
        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-green-700">
          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
        </span>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
      <p className="text-xs text-gray-500 truncate">{user.email}</p>
    </div>
    <button type="button" onClick={onChange} className="text-xs font-semibold text-blue-600 hover:underline flex-shrink-0">
      Changer
    </button>
  </div>
);

// ─── Create Promo Code Modal ───────────────────────────────────────────────────

const EMPTY_FORM = {
  code: '', discountType: 'percent', discountValue: '',
  partnerType: 'influencer',
  maxRedemptions: '', perCustomerLimit: '1', expiresAt: '',
  commissionEnabled: false, commissionType: 'percent', commissionValue: '',
};

const CreatePromoCodeModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedUser, setSelectedUser] = useState(null); // { _id, firstName, lastName, email, profileImage }
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [created, setCreated] = useState(null);

  const userSearch = useUserSearch();
  const [searchFocused, setSearchFocused] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    userSearch.setQuery('');
    userSearch.clear();
    setSearchFocused(false);
    setErrors((e) => ({ ...e, partnerUserId: undefined }));
  };

  const handleSave = async () => {
    const payload = { ...form, partnerUserId: selectedUser?._id };
    const { isValid, errors: validationErrors } = promoCodeService.validatePromoCodeData(payload);
    if (!isValid) { setErrors(validationErrors); return; }
    setErrors({});
    try {
      setSaving(true);
      const result = await promoCodeService.createPromoCode({
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        currency: form.discountType === 'fixed' ? 'USD' : undefined,
        partnerUserId: selectedUser._id,
        partnerType: form.partnerType || undefined,
        maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : undefined,
        perCustomerLimit: form.perCustomerLimit ? Number(form.perCustomerLimit) : undefined,
        expiresAt: form.expiresAt || undefined,
        commissionEnabled: form.commissionEnabled,
        commissionType: form.commissionEnabled ? form.commissionType : undefined,
        commissionValue: form.commissionEnabled ? Number(form.commissionValue) : undefined,
      });
      setCreated({ ...result, partnerEmail: selectedUser.email });
    } catch (e) {
      setErrors({ general: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Code promo créé</h2>
            </div>
            <button onClick={() => { onCreated(); onClose(); }} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{selectedUser?.firstName} {selectedUser?.lastName}</span> peut
              suivre ce code en se connectant à son portail partenaire avec son compte Congo Ndaku habituel
              (même email, même mot de passe).
            </p>
            <PartnerCredentialsChip code={form.code.toUpperCase()} partnerEmail={selectedUser?.email} />
          </div>
          <div className="flex justify-end p-6 border-t border-gray-100">
            <button onClick={() => { onCreated(); onClose(); }}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              Terminé
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nouveau code promo</h2>
            <p className="text-sm text-gray-500 mt-0.5">Le partenaire se connecte avec son compte Congo Ndaku existant</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errors.general && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {errors.general}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Code *</label>
            <input className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.code ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="WELCOME10" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type de réduction *</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" value={form.discountType} onChange={e => set('discountType', e.target.value)}>
                {DISCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Valeur * {form.discountType === 'fixed' && <span className="text-gray-400 font-normal">(USD)</span>}
              </label>
              <div className="relative">
                {form.discountType === 'fixed' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                )}
                <input type="number"
                  className={`w-full border rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${form.discountType === 'fixed' ? 'pl-7 pr-3' : 'px-3'} ${errors.discountValue ? 'border-red-300' : 'border-gray-200'}`}
                  placeholder={form.discountType === 'percent' ? '10' : '15'} value={form.discountValue} onChange={e => set('discountValue', e.target.value)} />
              </div>
              {errors.discountValue && <p className="text-xs text-red-500 mt-1">{errors.discountValue}</p>}
            </div>
          </div>

          {/* Partner — MUST be a real, selected user. No free text. */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Partenaire *</label>
            {selectedUser ? (
              <SelectedPartnerCard user={selectedUser} onChange={() => setSelectedUser(null)} />
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.partnerUserId ? 'border-red-300' : 'border-gray-200'}`}
                    placeholder="Rechercher par nom ou email…"
                    value={userSearch.query}
                    onChange={e => userSearch.setQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  />
                </div>
                {searchFocused && (
                  <UserSuggestions results={userSearch.results} searching={userSearch.searching} onSelect={handleSelectUser} />
                )}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Le partenaire se connectera avec ce code + son compte Congo Ndaku existant (même email et mot de passe qu'ailleurs sur la plateforme)
            </p>
            {errors.partnerUserId && <p className="text-xs text-red-500 mt-1">{errors.partnerUserId}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type de partenaire</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" value={form.partnerType} onChange={e => set('partnerType', e.target.value)}>
              {PARTNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Utilisations max</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Illimité" value={form.maxRedemptions} onChange={e => set('maxRedemptions', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max par client</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.perCustomerLimit} onChange={e => set('perCustomerLimit', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiration</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={form.commissionEnabled} onChange={e => set('commissionEnabled', e.target.checked)} className="rounded" />
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-indigo-500" /> Commission pour ce partenaire
              </span>
            </label>
            {form.commissionEnabled && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" value={form.commissionType} onChange={e => set('commissionType', e.target.value)}>
                  {COMMISSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input type="number" className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.commissionValue ? 'border-red-300' : 'border-gray-200'}`}
                  placeholder={form.commissionType === 'percent' ? '5' : '2'} value={form.commissionValue} onChange={e => set('commissionValue', e.target.value)} />
              </div>
            )}
            {form.commissionEnabled && (
              <p className="text-xs text-gray-400 mt-1.5 pl-6">
                {form.commissionType === 'percent'
                  ? 'Calculée sur le montant total des ventes générées par ce code'
                  : 'Un montant fixe versé à chaque utilisation du code'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Annuler</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Création...' : 'Créer le code'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PromoCodesPage = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      const result = await promoCodeService.getPromoCodes();
      setPromos(result?.promos || []);
    } catch (e) {
      console.error('PromoCodesPage:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromoCodes(); }, [fetchPromoCodes]);

  const filteredPromos = promos.filter(p => matchesSearch(p, searchTerm));

  const activeCount = promos.filter(p => p.isActive && !isExpired(p)).length;
  const totalSavings = promos.reduce((sum, p) => sum + (p.stats?.totalDiscountAmount || 0), 0);
  const totalCommissionOwed = promos.reduce((sum, p) => sum + (p.commissionAmount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Codes Promo</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Chargement...' : `${filteredPromos.length} code${filteredPromos.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Nouveau code
          </button>
          <button onClick={fetchPromoCodes}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Actifs', value: activeCount, icon: CheckCircle, color: 'green' },
            { label: 'Codes', value: promos.length, icon: Tag, color: 'blue' },
            { label: 'Économies clients', value: `$${totalSavings.toFixed(2)}`, icon: TrendingUp, color: 'amber' },
            { label: 'Commissions dues', value: `$${totalCommissionOwed.toFixed(2)}`, icon: Coins, color: 'indigo' },
          ].map(s => {
            const Icon = s.icon;
            const cls = {
              blue: ['border-blue-200', 'bg-blue-50', 'text-blue-600'],
              green: ['border-green-200', 'bg-green-50', 'text-green-600'],
              amber: ['border-amber-200', 'bg-amber-50', 'text-amber-600'],
              indigo: ['border-indigo-200', 'bg-indigo-50', 'text-indigo-600'],
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par code, partenaire ou email…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filteredPromos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-gray-200">
          <Tag className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">
            {searchTerm ? 'Aucun code trouvé avec ces critères' : 'Aucun code promo trouvé'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm ? 'Essayez un autre terme de recherche.' : 'Créez un code pour commencer.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPromos.map(p => (
            <PromoCodeRow key={p._id} promo={p} onRefresh={fetchPromoCodes} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePromoCodeModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchPromoCodes}
        />
      )}
    </div>
  );
};

export default PromoCodesPage;
