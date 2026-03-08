import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Building2, User, Mail, Phone, MapPin,
  FileText, Image, CheckCircle, XCircle, AlertTriangle,
  Lock, Unlock, Clock, ExternalLink, Eye, RefreshCw
} from 'lucide-react';
import hotelKycService from '../../services/hotelKyc.service';
import LoadingSpinner from '../Commons/LoadingSpinner';
import Toast from '../Commons/Toast';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

// ── Document Card ─────────────────────────────────────────────
const DocCard = ({ label, doc, type = 'file' }) => {
  if (!doc?.url) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50">
        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">{label} — Non fourni</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          <ExternalLink className="h-3 w-3" />
          Ouvrir
        </a>
      </div>
      <div className="p-4">
        {doc.number && (
          <p className="text-xs text-gray-500 mb-3">
            N° <span className="font-mono font-semibold text-gray-800">{doc.number || doc.idNumber}</span>
          </p>
        )}
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center group hover:bg-gray-200 transition-colors">
            <div className="text-center">
              <Eye className="h-8 w-8 text-gray-400 mx-auto mb-1 group-hover:text-blue-500 transition-colors" />
              <p className="text-xs text-gray-500 group-hover:text-blue-500">Voir le document</p>
            </div>
          </div>
        </a>
        {doc.uploadedAt && (
          <p className="text-xs text-gray-400 mt-2">Uploadé le {formatDate(doc.uploadedAt)}</p>
        )}
      </div>
    </div>
  );
};

// ── Photo Grid ────────────────────────────────────────────────
const PhotoGrid = ({ photos }) => {
  if (!photos?.urls?.length) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
        <Image className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Aucune photo fournie</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {photos.urls.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group">
          <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors flex items-center justify-center">
            <div className="text-center">
              <Image className="h-6 w-6 text-gray-400 mx-auto mb-1 group-hover:text-blue-500 transition-colors" />
              <p className="text-xs text-gray-400 group-hover:text-blue-500">Photo {i + 1}</p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

// ── Main Detail Component ─────────────────────────────────────
const HotelKYCDetail = ({ accountId, onBack, onReviewed }) => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockStatus, setLockStatus] = useState(null); // { acquired, expiresAt }
  const [action, setAction] = useState(null); // 'approve' | 'reject' | 'suspend'
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const keepaliveRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Lock on mount, unlock on unmount ─────────────────────────
  const acquireLock = useCallback(async () => {
    try {
      const data = await hotelKycService.lock(accountId);
      if (data.success) {
        setLockStatus({ acquired: true, expiresAt: data.lock?.expiresAt });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Impossible de verrouiller le dossier';
      const code = err.response?.data?.code;

      if (code === 'ALREADY_REVIEWING') {
        showToast(msg, 'error');
        // Go back — they have another one open
        setTimeout(() => onBack(), 2000);
      } else if (code === 'RECORD_LOCKED') {
        showToast(msg, 'warning');
        setLockStatus({ acquired: false });
      } else {
        showToast(msg, 'error');
      }
    }
  }, [accountId, onBack]);

  const releaseLock = useCallback(async () => {
    if (!lockStatus?.acquired) return;
    try {
      await hotelKycService.unlock(accountId);
    } catch (_) {}
  }, [accountId, lockStatus]);

  // Keepalive every 10 minutes
  const startKeepalive = useCallback(() => {
    keepaliveRef.current = setInterval(async () => {
      try {
        const data = await hotelKycService.refreshLock(accountId);
        if (data.success) {
          setLockStatus(prev => ({ ...prev, expiresAt: data.expiresAt }));
        }
      } catch (_) {}
    }, 10 * 60 * 1000); // 10 minutes
  }, [accountId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await hotelKycService.getAccount(accountId);
        setAccount(data.account);
      } catch (err) {
        showToast('Erreur lors du chargement du dossier', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
    acquireLock();

    return () => {
      releaseLock();
      if (keepaliveRef.current) clearInterval(keepaliveRef.current);
    };
  }, [accountId]);

  useEffect(() => {
    if (lockStatus?.acquired) {
      startKeepalive();
    }
    return () => {
      if (keepaliveRef.current) clearInterval(keepaliveRef.current);
    };
  }, [lockStatus?.acquired, startKeepalive]);

  // ── Submit action ────────────────────────────────────────────
  const handleSubmit = async () => {
    if ((action === 'reject' || action === 'suspend') && !reason.trim()) {
      showToast('Un motif est requis', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (action === 'approve') {
        await hotelKycService.approve(accountId);
        showToast(`KYC approuvé pour ${account.businessName}`, 'success');
      } else if (action === 'reject') {
        await hotelKycService.reject(accountId, reason);
        showToast(`KYC rejeté — le client sera notifié`, 'success');
      } else if (action === 'suspend') {
        await hotelKycService.suspend(accountId, reason);
        showToast(`Compte suspendu`, 'success');
      }

      // Unlock and go back
      await releaseLock();
      if (keepaliveRef.current) clearInterval(keepaliveRef.current);
      setTimeout(() => onReviewed?.(), 1000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la soumission', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = async () => {
    await releaseLock();
    if (keepaliveRef.current) clearInterval(keepaliveRef.current);
    onBack();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500">Dossier introuvable.</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline text-sm">Retour</button>
      </div>
    );
  }

  const isReadOnly = lockStatus?.acquired === false; // locked by someone else

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{account.businessName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dossier KYC · Révision en cours</p>
        </div>

        {/* Lock status indicator */}
        {lockStatus?.acquired ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Lock className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs font-semibold text-blue-700">Dossier verrouillé</p>
              <p className="text-xs text-blue-500">pour vous · 30 min</p>
            </div>
          </div>
        ) : lockStatus?.acquired === false ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-semibold text-amber-700">En lecture seule</p>
          </div>
        ) : null}
      </div>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            Ce dossier est en cours de traitement par un autre commercial. Vous pouvez le consulter mais pas agir dessus.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Account Info */}
        <div className="space-y-4">
          {/* Business Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              Informations
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Responsable</p>
                  <p className="text-sm font-medium text-gray-800">{account.fullName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-800">{account.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="text-sm text-gray-800">{account.phoneNumber}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Localisation</p>
                  <p className="text-sm text-gray-800">
                    {account.city}{account.province ? `, ${account.province}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Soumis le</p>
                  <p className="text-sm text-gray-800">{formatDate(account.kyc?.resubmittedAt || account.createdAt)}</p>
                  {account.kyc?.resubmittedAt && (
                    <p className="text-xs text-amber-600 mt-0.5">Resoumission</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Registration Fee */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Frais d'inscription</h2>
            <div className="flex items-center gap-2">
              {account.registrationFeeWaived ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                  Dispensé (promo)
                </span>
              ) : account.registrationFeePaid ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3" /> Payé
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                  <XCircle className="h-3 w-3" /> Non payé
                </span>
              )}
            </div>
          </div>

          {/* Previous rejection reason */}
          {account.kyc?.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-red-700 mb-1">Motif du rejet précédent</h2>
              <p className="text-sm text-red-600">{account.kyc.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Right — Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* KYC Docs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Documents KYC
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DocCard label="RCCM" doc={account.kyc?.rccm} />
              <DocCard label="Carte Nationale" doc={account.kyc?.nationalId} />
              <DocCard label="NIF" doc={account.kyc?.nif} />
            </div>
          </div>

          {/* Hotel Photos */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Image className="h-4 w-4 text-blue-500" />
              Photos de l'établissement
              {account.kyc?.hotelPhotos?.urls?.length > 0 && (
                <span className="text-xs text-gray-400">({account.kyc.hotelPhotos.urls.length} photo{account.kyc.hotelPhotos.urls.length > 1 ? 's' : ''})</span>
              )}
            </h2>
            <PhotoGrid photos={account.kyc?.hotelPhotos} />
          </div>

          {/* Action Panel */}
          {!isReadOnly && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Décision</h2>

              {/* Action selector */}
              {!action && (
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setAction('approve')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all"
                  >
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">Approuver</span>
                  </button>
                  <button
                    onClick={() => setAction('reject')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all"
                  >
                    <XCircle className="h-8 w-8 text-red-500" />
                    <span className="text-sm font-semibold text-red-700">Rejeter</span>
                  </button>
                  <button
                    onClick={() => setAction('suspend')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all"
                  >
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700">Suspendre</span>
                  </button>
                </div>
              )}

              {/* Confirm panel */}
              {action && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border-2 ${
                    action === 'approve' ? 'border-green-200 bg-green-50' :
                    action === 'reject'  ? 'border-red-200 bg-red-50' :
                                           'border-amber-200 bg-amber-50'
                  }`}>
                    <p className="text-sm font-semibold mb-1 ${
                      action === 'approve' ? 'text-green-700' :
                      action === 'reject'  ? 'text-red-700' : 'text-amber-700'
                    }">
                      {action === 'approve' && `Approuver le KYC de ${account.businessName}`}
                      {action === 'reject'  && `Rejeter le KYC de ${account.businessName}`}
                      {action === 'suspend' && `Suspendre le compte de ${account.businessName}`}
                    </p>
                    {action === 'approve' && (
                      <p className="text-xs text-green-600">Le compte sera activé et le client pourra commencer à gérer ses hôtels.</p>
                    )}
                  </div>

                  {(action === 'reject' || action === 'suspend') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motif <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder={
                          action === 'reject'
                            ? 'Ex: Documents illisibles, RCCM expiré, photos insuffisantes...'
                            : 'Motif de suspension...'
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setAction(null); setReason(''); }}
                      disabled={submitting}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className={`flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                        action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                        action === 'reject'  ? 'bg-red-600 hover:bg-red-700' :
                                               'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                      {submitting ? 'En cours...' : (
                        action === 'approve' ? 'Confirmer l\'approbation' :
                        action === 'reject'  ? 'Confirmer le rejet' :
                                               'Confirmer la suspension'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default HotelKYCDetail;
