import React, { useState } from 'react';
import {
  ArrowLeft, Building2, User, Mail, Phone, MapPin,
  FileText, Image, CheckCircle, XCircle, AlertTriangle,
  ExternalLink, Eye, RefreshCw, Clock, Layers, ZoomIn,
} from 'lucide-react';
import apiClient from '../../services/api';

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—';

const LEVEL_LABELS = {
  informal:    'Informel',
  semi_formal: 'Semi-formel',
  formal:      'Formel',
};

const DOC_LABELS = {
  businessLogo: 'Logo du business',
  nationalId: "Carte d'identité nationale",
  selfie:     "Selfie avec pièce d'identité",
  patente:    'Patente / Licence commerciale',
  rccm:       'RCCM',
};

const STATUS_STYLES = {
  pending:      'bg-yellow-50 border-yellow-200 text-yellow-700',
  under_review: 'bg-blue-50 border-blue-200 text-blue-700',
  approved:     'bg-green-50 border-green-200 text-green-700',
  rejected:     'bg-red-50 border-red-200 text-red-700',
  suspended:    'bg-amber-50 border-amber-200 text-amber-700',
};

const STATUS_LABELS = {
  pending:      'En attente',
  under_review: 'En examen',
  approved:     'Approuvé',
  rejected:     'Rejeté',
  suspended:    'Suspendu',
};

// ── Inline image viewer modal ─────────────────────────────────
const ImageModal = ({ url, label, onClose }) => (
  <div
    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
      <button
        onClick={onClose}
        className="absolute -top-10 right-0 text-white text-sm hover:underline"
      >
        ✕ Fermer
      </button>
      <p className="text-white text-xs text-center mb-2 font-semibold uppercase tracking-wide">{label}</p>
      <img
        src={url}
        alt={label}
        className="w-full max-h-[80vh] object-contain rounded-xl"
      />
    </div>
  </div>
);

// ── Document card — shows thumbnail inline ────────────────────
const DocCard = ({ label, url }) => {
  const [lightbox, setLightbox] = useState(false);

  if (!url) return (
    <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50">
      <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-400">{label} — Non fourni</p>
    </div>
  );

  const isPDF = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');

  return (
    <>
      {lightbox && <ImageModal url={url} label={label} onClose={() => setLightbox(false)} />}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide truncate mr-2">{label}</span>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 flex-shrink-0">
            <ExternalLink className="h-3 w-3" /> Ouvrir
          </a>
        </div>
        <div
          className="h-44 bg-gray-100 overflow-hidden cursor-pointer relative group"
          onClick={() => !isPDF && setLightbox(true)}
        >
          {isPDF ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <FileText className="h-10 w-10 text-gray-400" />
              <p className="text-xs text-gray-500">Document PDF</p>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline">Ouvrir le PDF</a>
            </div>
          ) : (
            <>
              <img
                src={url}
                alt={label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><p class="text-xs text-gray-400">Aperçu non disponible</p></div>';
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white/90 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                  <ZoomIn className="h-3.5 w-3.5 text-gray-700" />
                  <span className="text-xs font-semibold text-gray-700">Agrandir</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// ── Main ─────────────────────────────────────────────────────
const PartnerDetail = ({ partner: initialPartner, onBack, onReviewed }) => {
  const [partner, setPartner]       = useState(initialPartner);
  const [loading, setLoading]       = useState(false);
  const [action, setAction]         = useState(null);
  const [reason, setReason]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [toast, setToast]           = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const reload = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/business-partner/admin/${partner._id}`);
      setPartner(res.data.partner);
    } catch {
      setError('Erreur de rechargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if ((action === 'rejected' || action === 'suspended') && !reason.trim()) {
      setError('Un motif est requis.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiClient.put(`/business-partner/admin/${partner._id}/review`, {
        status: action,
        rejectionReason: reason || undefined,
      });
      showToast(
        action === 'approved'     ? `Partenaire approuvé — ${partner.businessName}` :
        action === 'rejected'     ? 'Demande rejetée.' :
        action === 'under_review' ? "Marqué en cours d'examen." :
        'Compte suspendu.',
        'success'
      );
      await reload();
      setAction(null);
      setReason('');
      onReviewed?.();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const docs   = partner.documents || {};
  const photos = docs.businessPhotos || [];
  const isApproved = partner.status === 'approved';

  return (
    <div className="space-y-6">
      {/* Lightbox for business photos */}
      {lightboxPhoto && (
        <ImageModal
          url={lightboxPhoto.url}
          label={`Photo ${lightboxPhoto.index + 1} / ${photos.length}`}
          onClose={() => setLightboxPhoto(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{partner.businessName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Demande Partenaire · {fmt(partner.createdAt)}</p>
        </div>
        <button onClick={reload} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${STATUS_STYLES[partner.status] || 'bg-gray-100 border-gray-200 text-gray-600'}`}>
          {STATUS_LABELS[partner.status] || partner.status}
        </span>
      </div>

      {/* Approved banner */}
      {isApproved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700">Partenaire approuvé</p>
            <p className="text-xs text-green-600">
              {partner.approvedAt ? `Approuvé le ${fmt(partner.approvedAt)}` : 'Compte actif'}
              {partner.reviewedBy?.firstName ? ` par ${partner.reviewedBy.firstName} ${partner.reviewedBy.lastName || ''}` : ''}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-500" /> Informations
            </h2>
            {[
              { icon: Building2, label: 'Business',     value: partner.businessName },
              { icon: Layers,    label: 'Type',         value: partner.businessType?.nameFr },
              { icon: Layers,    label: 'Niveau',       value: LEVEL_LABELS[partner.businessLevel] },
              { icon: User,      label: 'Propriétaire', value: partner.user ? `${partner.user.firstName} ${partner.user.lastName}` : null },
              { icon: Mail,      label: 'Email',        value: partner.user?.email },
              { icon: Phone,     label: 'Téléphone',    value: partner.businessPhone },
              { icon: Phone,     label: 'WhatsApp',     value: partner.businessWhatsapp },
              { icon: MapPin,    label: 'Commune',      value: partner.commune },
              { icon: MapPin,    label: 'Ville',        value: partner.ville },
              { icon: MapPin,    label: 'Adresse',      value: partner.address },
              { icon: Clock,     label: 'Soumis le',    value: fmt(partner.createdAt) },
            ].filter(r => r.value).map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              </div>
            ))}
            {partner.description && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700">{partner.description}</p>
              </div>
            )}
          </div>

          {partner.status === 'rejected' && partner.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-700 mb-1">Motif du rejet</p>
              <p className="text-sm text-red-600">{partner.rejectionReason}</p>
            </div>
          )}

          {partner.referredBy && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Apporté par</p>
              <p className="text-sm font-semibold text-gray-800">
                {partner.referredBy.firstName} {partner.referredBy.lastName}
              </p>
            </div>
          )}
        </div>

        {/* Right — docs + action */}
        <div className="lg:col-span-2 space-y-6">

          {/* Documents */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-500" /> Documents
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(DOC_LABELS).map(([key, label]) => (
                <DocCard key={key} label={label} url={docs[key]} />
              ))}
            </div>
          </div>

          {/* Business photos */}
          {photos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Image className="h-4 w-4 text-orange-500" />
                Photos du business ({photos.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 hover:border-orange-300 transition-colors cursor-pointer relative group"
                    onClick={() => setLightboxPhoto({ url, index: i })}
                  >
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white/90 rounded-lg px-2 py-1 flex items-center gap-1">
                        <ZoomIn className="h-3 w-3 text-gray-700" />
                        <span className="text-xs font-semibold text-gray-700">Voir</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action panel — hidden when approved */}
          {!isApproved && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Décision</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
              )}

              {!action ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'under_review', label: 'En examen',  color: 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400',     icon: Eye,           textColor: 'text-blue-700'   },
                    { key: 'approved',     label: 'Approuver',  color: 'border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400', icon: CheckCircle,   textColor: 'text-green-700'  },
                    { key: 'rejected',     label: 'Rejeter',    color: 'border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400',         icon: XCircle,       textColor: 'text-red-700'    },
                    { key: 'suspended',    label: 'Suspendre',  color: 'border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400', icon: AlertTriangle, textColor: 'text-amber-700'  },
                  ].map(btn => {
                    const Icon = btn.icon;
                    return (
                      <button key={btn.key} onClick={() => setAction(btn.key)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${btn.color}`}>
                        <Icon className={`h-7 w-7 ${btn.textColor}`} />
                        <span className={`text-sm font-semibold ${btn.textColor}`}>{btn.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border-2 ${
                    action === 'approved'     ? 'border-green-200 bg-green-50' :
                    action === 'rejected'     ? 'border-red-200 bg-red-50' :
                    action === 'under_review' ? 'border-blue-200 bg-blue-50' :
                                                'border-amber-200 bg-amber-50'
                  }`}>
                    <p className={`text-sm font-semibold ${
                      action === 'approved'     ? 'text-green-700' :
                      action === 'rejected'     ? 'text-red-700'   :
                      action === 'under_review' ? 'text-blue-700'  : 'text-amber-700'
                    }`}>
                      {action === 'approved'     && `Approuver ${partner.businessName}`}
                      {action === 'rejected'     && `Rejeter la demande de ${partner.businessName}`}
                      {action === 'under_review' && "Marquer en cours d'examen"}
                      {action === 'suspended'    && `Suspendre ${partner.businessName}`}
                    </p>
                    {action === 'approved' && (
                      <p className="text-xs text-green-600 mt-1">
                        Le partenaire sera notifié et pourra accéder à son espace.
                      </p>
                    )}
                  </div>

                  {(action === 'rejected' || action === 'suspended') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motif <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder={action === 'rejected'
                          ? 'Ex: Documents illisibles, informations incomplètes...'
                          : 'Motif de suspension...'}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setAction(null); setReason(''); setError(''); }}
                      disabled={submitting}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className={`flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 ${
                        action === 'approved'     ? 'bg-green-600 hover:bg-green-700' :
                        action === 'rejected'     ? 'bg-red-600 hover:bg-red-700'     :
                        action === 'under_review' ? 'bg-blue-600 hover:bg-blue-700'   :
                                                     'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                      {submitting ? 'En cours...' : (
                        action === 'approved'     ? "Confirmer l'approbation" :
                        action === 'rejected'     ? 'Confirmer le rejet'      :
                        action === 'under_review' ? 'Marquer en examen'       :
                                                     'Confirmer la suspension'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* For approved — allow suspend only */}
          {isApproved && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Actions</h2>
              {!action ? (
                <button
                  onClick={() => setAction('suspended')}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-xl text-amber-700 text-sm font-semibold transition-all"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Suspendre ce partenaire
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50">
                    <p className="text-sm font-semibold text-amber-700">Suspendre {partner.businessName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motif <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Motif de suspension..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setAction(null); setReason(''); setError(''); }}
                      disabled={submitting}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                      {submitting ? 'En cours...' : 'Confirmer la suspension'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PartnerDetail;
