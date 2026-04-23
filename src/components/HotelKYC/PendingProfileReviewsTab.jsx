import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, Building2, Phone, Mail, Calendar,
  CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight,
  FileText, Eye, Download, Image, X, AlertCircle, Loader,
  Bell, ArrowLeft, User, MapPin, Check, ArrowRight,
} from 'lucide-react';
import hotelKycService from '../../services/hotelKyc.service';

const fmt = (date) =>
  date
    ? new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

const fmtRelative = (date) => {
  if (!date) return '—';
  const diff  = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `il y a ${days}j`;
  if (hours > 0) return `il y a ${hours}h`;
  return "à l'instant";
};

const downloadFile = (url) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = url.split('/').pop() || 'file';
  a.target = '_blank';
  a.click();
};

const CHANGE_LABELS = {
  businessName:    'Nom du business',
  businessAddress: 'Adresse',
  city:            'Ville',
  province:        'Province',
  commune:         'Commune',
  rccmDoc:         'Document RCCM',
  nationalIdDoc:   'Carte nationale',
  hotelPhotos:     'Photos hôtel',
};

const parseChanges = (reason) => {
  if (!reason) return [];
  return reason.split(',').map((s) => s.trim()).filter(Boolean);
};

const DocViewer = ({ label, doc }) => {
  if (!doc?.url) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <span className="text-sm text-gray-700">{label}</span>
        {doc.uploadedAt && <span className="text-xs text-gray-400">· {fmt(doc.uploadedAt)}</span>}
      </div>
      <div className="flex items-center gap-2">
        <a href={doc.url} target="_blank" rel="noreferrer"
           className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-600 hover:bg-blue-100 transition-colors">
          <Eye className="h-3 w-3" /> Voir
        </a>
        <button onClick={() => downloadFile(doc.url)}
                className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors">
          <Download className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

const PhotoGrid = ({ urls, label, badge, badgeColor = 'bg-gray-100 text-gray-600' }) => {
  const [lightbox, setLightbox] = useState(null);
  if (!urls || urls.length === 0) return (
    <div className="flex items-center justify-center h-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
      <p className="text-xs text-gray-400 italic">Aucune photo</p>
    </div>
  );
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        {badge && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeColor}`}>{badge}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {urls.map((url, i) => (
          <div key={url} className="relative group w-16 h-16">
            <img src={url} alt={`Photo ${i + 1}`}
                 className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer"
                 onClick={() => setLightbox(url)} />
            <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button onClick={() => setLightbox(url)} className="p-1 bg-white/20 hover:bg-white/40 rounded text-white"><Eye className="h-3 w-3" /></button>
              <button onClick={() => downloadFile(url)} className="p-1 bg-white/20 hover:bg-white/40 rounded text-white"><Download className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-1">{urls.length} photo{urls.length !== 1 ? 's' : ''}</p>
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-xl text-white" onClick={() => setLightbox(null)}>
            <X className="h-5 w-5" />
          </button>
          <img src={lightbox} alt="Vue agrandie" className="max-w-full max-h-full object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

const RejectModal = ({ account, onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Rejeter les modifications</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{account?.businessName}</p>
              <p className="text-xs text-gray-500">{account?.email}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Raison du rejet <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              rows={3}
              placeholder="Expliquez pourquoi les modifications ne sont pas acceptées..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Annuler</button>
          <button onClick={() => onConfirm(reason)} disabled={loading || !reason.trim()}
                  className="px-5 py-2 text-white text-sm font-semibold bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50">
            {loading ? 'En cours...' : 'Rejeter'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReviewDetail = ({ account, onBack, onApproved }) => {
  const [approving,  setApproving]  = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejecting,  setRejecting]  = useState(false);
  const [error,      setError]      = useState('');

  const changes        = parseChanges(account.pendingProfileReviewReason);
  const hasDocChanges  = changes.some((c) => ['rccmDoc', 'nationalIdDoc'].includes(c));
  const hasPhotoChange = changes.includes('hotelPhotos');
  const hasInfoChanges = changes.some((c) => !['rccmDoc', 'nationalIdDoc', 'hotelPhotos'].includes(c));

  const currentPhotos  = account.kyc?.hotelPhotos?.urls || [];
  const proposedPhotos = account.kyc?.pendingHotelPhotos?.urls || [];

  const handleApprove = async () => {
    setError('');
    try {
      setApproving(true);
      await hotelKycService.approveProfileUpdate(account.id);
      onApproved?.();
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de l'approbation");
      setApproving(false);
    }
  };

  const handleReject = async (reason) => {
    setError('');
    try {
      setRejecting(true);
      await hotelKycService.rejectProfileUpdate(account.id, reason);
      setShowReject(false);
      onApproved?.();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors du rejet');
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0 mt-0.5">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">{account.businessName}</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
              <Bell className="h-3 w-3" /> Révision en attente
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{account.fullName} · {account.email}</p>
          <p className="text-xs text-gray-400 mt-1">
            Soumis {fmtRelative(account.pendingProfileReviewAt)} — {fmt(account.pendingProfileReviewAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setShowReject(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 text-sm font-semibold rounded-xl hover:bg-red-100 border border-red-200 transition-colors">
            <XCircle className="h-4 w-4" /> Rejeter
          </button>
          <button onClick={handleApprove} disabled={approving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
            {approving ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {approving ? 'Approbation...' : 'Approuver'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {changes.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-2">Éléments modifiés</p>
          <div className="flex flex-wrap gap-2">
            {changes.map((c) => (
              <span key={c} className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                c === 'hotelPhotos' ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : ['rccmDoc', 'nationalIdDoc'].includes(c) ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-orange-100 text-orange-800 border-orange-200'
              }`}>
                {CHANGE_LABELS[c] || c}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Informations actuelles</p>
            <div className="space-y-3">
              {[
                { label: 'Propriétaire', value: account.fullName,        icon: User     },
                { label: 'Email',        value: account.email,           icon: Mail     },
                { label: 'Téléphone',    value: account.phoneNumber,     icon: Phone    },
                { label: 'Adresse',      value: account.businessAddress, icon: MapPin   },
                { label: 'Ville',        value: [account.commune, account.city, account.province].filter(Boolean).join(', '), icon: MapPin },
                { label: 'Inscrit le',   value: fmt(account.createdAt),  icon: Calendar },
              ].map(({ label, value, icon: Icon }) =>
                value ? (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-900">{value}</p>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {(hasDocChanges || account.kyc?.rccm?.url || account.kyc?.nationalId?.url) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Documents KYC
                {hasDocChanges && <span className="ml-2 normal-case text-orange-600 font-semibold">· modifiés</span>}
              </p>
              <DocViewer label="RCCM"           doc={account.kyc?.rccm}       />
              <DocViewer label="Carte nationale" doc={account.kyc?.nationalId} />
              <DocViewer label="NIF"             doc={account.kyc?.nif}        />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {hasPhotoChange ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Photos hôtel · <span className="text-orange-600 normal-case font-semibold">remplacement proposé</span>
              </p>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <PhotoGrid
                    urls={currentPhotos}
                    label="Photos actuelles (en ligne)"
                    badge="EN LIGNE"
                    badgeColor="bg-green-100 text-green-700"
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-px flex-1 bg-gray-200" />
                  <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                    <ArrowRight className="h-3 w-3" /> Remplacement proposé
                  </div>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <PhotoGrid
                    urls={proposedPhotos}
                    label="Nouvelles photos proposées"
                    badge="EN ATTENTE"
                    badgeColor="bg-purple-100 text-purple-700"
                  />
                  {account.kyc?.pendingHotelPhotos?.uploadedAt && (
                    <p className="text-xs text-gray-400 mt-2">Soumis le {fmt(account.kyc.pendingHotelPhotos.uploadedAt)}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  Si vous approuvez, les photos actuelles seront <strong>remplacées</strong> par les nouvelles et l'app sera mise à jour immédiatement.
                </p>
              </div>
            </div>
          ) : currentPhotos.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Photos hôtel actuelles</p>
              <PhotoGrid urls={currentPhotos} label="Photos en ligne" badge="INCHANGÉES" badgeColor="bg-gray-100 text-gray-600" />
            </div>
          )}

          {hasInfoChanges && !hasDocChanges && !hasPhotoChange && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Modifications textuelles</p>
              <p className="text-sm text-gray-600 mb-3">
                L'opérateur a mis à jour des informations de son profil. Vérifiez les informations à gauche et approuvez si elles sont correctes.
              </p>
              <div className="flex flex-wrap gap-2">
                {changes.filter((c) => !['rccmDoc', 'nationalIdDoc', 'hotelPhotos'].includes(c)).map((c) => (
                  <span key={c} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    {CHANGE_LABELS[c] || c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Votre décision</p>
            <p className="text-sm text-gray-600 mb-4">
              Le compte reste <span className="font-semibold text-green-700">actif</span> et visible dans l'app pendant votre révision.
              Votre décision supprimera ce dossier de la file.
            </p>
            <div className="flex gap-3">
              <button onClick={handleApprove} disabled={approving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                {approving ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {approving ? 'Approbation...' : 'Approuver les modifications'}
              </button>
              <button onClick={() => setShowReject(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-red-700 text-sm font-semibold rounded-xl hover:bg-red-50 border border-red-200 transition-colors">
                <XCircle className="h-4 w-4" /> Rejeter
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReject && (
        <RejectModal account={account} loading={rejecting} onConfirm={handleReject} onClose={() => setShowReject(false)} />
      )}
    </div>
  );
};

const PendingProfileReviewsTab = () => {
  const [accounts,    setAccounts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [total,       setTotal]       = useState(0);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const load = useCallback(async (p = 1, s = search) => {
    try {
      setLoading(true);
      setError('');
      const data = await hotelKycService.getPendingProfileReviews({ page: p, limit: 20, search: s || undefined });
      setAccounts(data.accounts || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.total || 0);
      setPage(p);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => load(1, search), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search]);

  if (selectedAccount) {
    return (
      <ReviewDetail
        account={selectedAccount}
        onBack={() => setSelectedAccount(null)}
        onApproved={() => { setSelectedAccount(null); load(page, search); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Révisions de profil en attente</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Chargement...'
              : total === 0 ? 'Aucune révision en attente — tout est à jour ✓'
              : `${total} opérateur${total !== 1 ? 's' : ''} avec des modifications à réviser`}
          </p>
        </div>
        <button onClick={() => load(page, search)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher un opérateur..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-gray-200">
          <CheckCircle className="h-12 w-12 text-green-400 mb-3" />
          <p className="font-semibold text-gray-700">Aucune révision en attente</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Aucun résultat pour cette recherche.' : 'Toutes les modifications ont été traitées.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => {
            const changes      = parseChanges(account.pendingProfileReviewReason);
            const hasPhotos    = changes.includes('hotelPhotos');
            const hasDocs      = changes.some((c) => ['rccmDoc', 'nationalIdDoc'].includes(c));
            const pendingCount = account.kyc?.pendingHotelPhotos?.urls?.length || 0;
            const currentCount = account.kyc?.hotelPhotos?.urls?.length || 0;
            return (
              <button
                key={account.id}
                onClick={() => setSelectedAccount(account)}
                className="w-full bg-white border border-orange-200 rounded-2xl p-4 flex items-center gap-4 hover:border-orange-400 hover:shadow-sm transition-all text-left group"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg font-bold">{account.businessName?.[0] || '?'}</span>
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-gray-900 text-sm">{account.businessName}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                      <Bell className="h-3 w-3" /> Révision
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-500"><User className="h-3 w-3" /> {account.fullName}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Mail className="h-3 w-3" /> {account.email}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="h-3 w-3" /> {fmtRelative(account.pendingProfileReviewAt)}</span>
                  </div>
                  {changes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {changes.map((c) => (
                        <span key={c} className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          c === 'hotelPhotos' ? 'bg-purple-100 text-purple-700'
                            : ['rccmDoc', 'nationalIdDoc'].includes(c) ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {CHANGE_LABELS[c] || c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasPhotos && pendingCount > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded-lg">
                      <Image className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700">{currentCount} → {pendingCount}</span>
                    </div>
                  )}
                  {hasDocs && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700">Docs</span>
                    </div>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => load(page - 1, search)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">
            Précédent
          </button>
          <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => load(page + 1, search)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default PendingProfileReviewsTab;
