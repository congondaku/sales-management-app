import React, { useState, useEffect, useCallback } from "react";
import {
  Search, RefreshCw, Building2, Phone, Mail, Calendar,
  CheckCircle, XCircle, Clock, AlertTriangle, Ban,
  ChevronDown, ChevronUp, Shield, ShieldOff, User,
  FileText, Star, X, AlertCircle, Edit, Eye, DollarSign,
  MapPin, Bed, Image, ChevronRight, ArrowLeft, History,
  Hotel, Send, Check, Loader, Bell, Download,
} from "lucide-react";
import hotelKycService from "../../services/hotelKyc.service";
import { apiHelpers } from "../../services/api";

// ── Helpers ───────────────────────────────────────────────────
const fmt = (date) =>
  date
    ? new Date(date).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

const fmtFull = (date) =>
  date
    ? new Date(date).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

const fmtRelative = (date) => {
  if (!date) return "";
  const diff  = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `il y a ${days}j`;
  if (hours > 0) return `il y a ${hours}h`;
  return "à l'instant";
};

const downloadFile = (url) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = url.split("/").pop() || "file";
  a.target = "_blank";
  a.click();
};

const CHANGE_LABELS = {
  businessName:    "Nom du business",
  businessAddress: "Adresse",
  city:            "Ville",
  province:        "Province",
  commune:         "Commune",
  rccmDoc:         "Document RCCM",
  nationalIdDoc:   "Carte nationale",
  hotelPhotos:     "Photos hôtel",
};

const parseChanges = (reason) => {
  if (!reason) return [];
  return reason.split(",").map((s) => s.trim()).filter(Boolean);
};

const STATUS_CONFIG = {
  pending_kyc:   { label: "En attente KYC",   bg: "bg-gray-100",   text: "text-gray-600",  icon: Clock        },
  kyc_submitted: { label: "KYC Soumis",        bg: "bg-blue-100",   text: "text-blue-700",  icon: FileText     },
  kyc_rejected:  { label: "KYC Rejeté",        bg: "bg-red-100",    text: "text-red-700",   icon: XCircle      },
  active:        { label: "Actif",             bg: "bg-green-100",  text: "text-green-700", icon: CheckCircle  },
  grace_period:  { label: "Période de grâce",  bg: "bg-yellow-100", text: "text-yellow-700",icon: AlertTriangle},
  expired:       { label: "Expiré",            bg: "bg-orange-100", text: "text-orange-700",icon: AlertTriangle},
  suspended:     { label: "Suspendu",          bg: "bg-amber-100",  text: "text-amber-700", icon: ShieldOff    },
  banned:        { label: "Banni",             bg: "bg-red-200",    text: "text-red-800",   icon: Ban          },
};

const ALL_STATUSES = [
  { value: "",              label: "Tous les statuts"  },
  { value: "pending_kyc",   label: "En attente KYC"   },
  { value: "kyc_submitted", label: "KYC Soumis"       },
  { value: "kyc_rejected",  label: "KYC Rejeté"       },
  { value: "active",        label: "Actif"            },
  { value: "grace_period",  label: "Période de grâce" },
  { value: "expired",       label: "Expiré"           },
  { value: "suspended",     label: "Suspendu"         },
  { value: "banned",        label: "Banni"            },
];

const EDIT_FIELDS = [
  { key: "firstName",       label: "Prénom"           },
  { key: "lastName",        label: "Nom"              },
  { key: "phoneNumber",     label: "Téléphone perso"  },
  { key: "businessName",    label: "Nom du business"  },
  { key: "businessAddress", label: "Adresse"          },
  { key: "hotelPhoneNumber",label: "Tél. hôtel"       },
  { key: "city",            label: "Ville"            },
  { key: "province",        label: "Province"         },
  { key: "commune",         label: "Commune"          },
];

// ── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: "bg-gray-100", text: "text-gray-600", icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

// ── Action Modal ──────────────────────────────────────────────
const ActionModal = ({ action, operator, onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState("");
  const CONFIG = {
    suspend:   { title: "Suspendre le compte",      btnColor: "bg-amber-600 hover:bg-amber-700", needsReason: true  },
    unsuspend: { title: "Lever la suspension",       btnColor: "bg-green-600 hover:bg-green-700", needsReason: false },
    ban:       { title: "Bannir définitivement",     btnColor: "bg-red-700   hover:bg-red-800",   needsReason: true  },
  };
  const cfg = CONFIG[action];
  if (!cfg) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{cfg.title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{operator?.businessName}</p>
              <p className="text-xs text-gray-500">{operator?.email}</p>
            </div>
          </div>
          {cfg.needsReason && (
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
              placeholder="Raison obligatoire..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">
            Annuler
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || (cfg.needsReason && !reason.trim())}
            className={`px-5 py-2 text-white text-sm font-semibold rounded-xl disabled:opacity-50 ${cfg.btnColor}`}
          >
            {loading ? "En cours..." : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Pending Profile Review Panel ──────────────────────────────
// Shown inside OperatorDetail > Info tab when pendingProfileReview is true
const PendingReviewPanel = ({ account, onResolved }) => {
  const [approving,  setApproving]  = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting,  setRejecting]  = useState(false);
  const [error,      setError]      = useState("");
  const [lightbox,   setLightbox]   = useState(null);

  const changes       = parseChanges(account.pendingProfileReviewReason);
  const hasPhotoChange = changes.includes("hotelPhotos");
  const hasDocChange   = changes.some((c) => ["rccmDoc", "nationalIdDoc"].includes(c));

  const handleApprove = async () => {
    setError("");
    try {
      setApproving(true);
      await hotelKycService.approveProfileUpdate(account.id);
      onResolved?.();
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de l'approbation");
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setError("");
    try {
      setRejecting(true);
      await hotelKycService.rejectProfileUpdate(account.id, rejectReason.trim());
      setShowReject(false);
      onResolved?.();
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors du rejet");
      setRejecting(false);
    }
  };

  const photos = account.kyc?.hotelPhotos?.urls || [];

  return (
    <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-5 w-5 text-orange-600" />
            <p className="font-bold text-orange-800">Modifications en attente de révision</p>
          </div>
          <p className="text-xs text-orange-600">
            Soumis {fmtRelative(account.pendingProfileReviewAt)} · {fmtFull(account.pendingProfileReviewAt)}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* What changed */}
      {changes.length > 0 && (
        <div>
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-2">
            Éléments modifiés
          </p>
          <div className="flex flex-wrap gap-2">
            {changes.map((c) => (
              <span
                key={c}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                  c === "hotelPhotos"
                    ? "bg-purple-100 text-purple-700 border-purple-200"
                    : ["rccmDoc", "nationalIdDoc"].includes(c)
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-orange-100 text-orange-800 border-orange-200"
                }`}
              >
                {CHANGE_LABELS[c] || c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* KYC docs — only shown if they changed */}
      {hasDocChange && (
        <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Documents mis à jour
          </p>
          {account.kyc?.rccm?.url && changes.includes("rccmDoc") && (
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-700">RCCM</span>
                <span className="text-xs text-gray-400">· {fmt(account.kyc.rccm.uploadedAt)}</span>
              </div>
              <div className="flex gap-2">
                <a href={account.kyc.rccm.url} target="_blank" rel="noreferrer"
                   className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-600 hover:bg-blue-100">
                  <Eye className="h-3 w-3" /> Voir
                </a>
                <button onClick={() => downloadFile(account.kyc.rccm.url)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-100">
                  <Download className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
          {account.kyc?.nationalId?.url && changes.includes("nationalIdDoc") && (
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-700">Carte nationale</span>
                <span className="text-xs text-gray-400">· {fmt(account.kyc.nationalId.uploadedAt)}</span>
              </div>
              <div className="flex gap-2">
                <a href={account.kyc.nationalId.url} target="_blank" rel="noreferrer"
                   className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-600 hover:bg-blue-100">
                  <Eye className="h-3 w-3" /> Voir
                </a>
                <button onClick={() => downloadFile(account.kyc.nationalId.url)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-100">
                  <Download className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hotel photos — only shown if they changed */}
      {hasPhotoChange && photos.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Photos mises à jour ({photos.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <div key={url} className="relative group w-20 h-20">
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="w-20 h-20 object-cover rounded-xl border border-gray-200 cursor-pointer"
                  onClick={() => setLightbox(url)}
                />
                <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button onClick={() => setLightbox(url)}
                          className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white">
                    <Eye className="h-3 w-3" />
                  </button>
                  <button onClick={() => downloadFile(url)}
                          className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white">
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {account.kyc?.hotelPhotos?.uploadedAt && (
            <p className="text-xs text-gray-400 mt-2">
              Mis à jour le {fmt(account.kyc.hotelPhotos.uploadedAt)}
            </p>
          )}
        </div>
      )}

      {/* Decision buttons */}
      {!showReject ? (
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleApprove}
            disabled={approving}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {approving ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {approving ? "Approbation..." : "Approuver les modifications"}
          </button>
          <button
            onClick={() => setShowReject(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-700 text-sm font-semibold rounded-xl hover:bg-red-50 border border-red-300 transition-colors"
          >
            <XCircle className="h-4 w-4" /> Rejeter
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-orange-700 mb-1.5">
              Raison du rejet <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-orange-300 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              rows={3}
              placeholder="Expliquez pourquoi les modifications ne sont pas acceptées..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReject}
              disabled={rejecting || !rejectReason.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {rejecting ? <Loader className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              {rejecting ? "En cours..." : "Confirmer le rejet"}
            </button>
            <button
              onClick={() => { setShowReject(false); setRejectReason(""); }}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-orange-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
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

// ── Edit Modal ────────────────────────────────────────────────
const EditModal = ({ operator, isAdmin, onClose, onSave }) => {
  const [form, setForm]     = useState(() => {
    const f = {};
    EDIT_FIELDS.forEach(({ key }) => { f[key] = operator[key] || ""; });
    return f;
  });
  const [note,           setNote]           = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [rccmFile,       setRccmFile]       = useState(null);
  const [nationalIdFile, setNationalIdFile] = useState(null);
  const [nifFile,        setNifFile]        = useState(null);
  const [newPhotos,      setNewPhotos]      = useState([]);
  const [removedUrls,    setRemovedUrls]    = useState([]);
  const [removing,       setRemoving]       = useState(null);

  const existingRccm       = operator.kyc?.rccm?.url;
  const existingNationalId = operator.kyc?.nationalId?.url;
  const existingNif        = operator.kyc?.nif?.url;
  const existingPhotos     = operator.kyc?.hotelPhotos?.urls || [];
  const visiblePhotos      = existingPhotos.filter((u) => !removedUrls.includes(u));

  const handleRemoveExisting = async (url) => {
    if (isAdmin) {
      try {
        setRemoving(url);
        await hotelKycService.removeKycPhoto(operator.id, url);
        setRemovedUrls((p) => [...p, url]);
      } catch (e) {
        setError(e.response?.data?.message || "Erreur lors de la suppression");
      } finally {
        setRemoving(null);
      }
    } else {
      setRemovedUrls((p) => [...p, url]);
    }
  };

  const handleSave = async () => {
    setError("");
    try {
      setLoading(true);
      const payload = {
        ...form,
        note,
        ...(rccmFile       && { rccmDoc:       rccmFile       }),
        ...(nationalIdFile && { nationalIdDoc: nationalIdFile }),
        ...(nifFile        && { nifDoc:         nifFile       }),
        ...(newPhotos.length > 0 && { hotelPhotos: newPhotos }),
        ...(removedUrls.length > 0 && !isAdmin && { removedPhotos: removedUrls.join(",") }),
      };
      if (isAdmin) {
        await hotelKycService.adminUpdate(operator.id, payload);
      } else {
        await hotelKycService.requestEdit(operator.id, payload);
      }
      onSave();
    } catch (e) {
      setError(e.response?.data?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const DocPicker = ({ label, existingUrl, file, onFile, accept = "image/*,application/pdf" }) => (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-gray-500">{label}</label>
      <div className="flex items-center gap-2 flex-wrap">
        {existingUrl && !file && (
          <div className="flex items-center gap-1">
            <a href={existingUrl} target="_blank" rel="noreferrer"
               className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-600 hover:bg-blue-100">
              <FileText className="h-3 w-3" /> Voir
            </a>
          </div>
        )}
        {file && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
            <CheckCircle className="h-3 w-3" />
            <span className="max-w-24 truncate">{file.name}</span>
            <button onClick={() => onFile(null)} className="ml-1 text-gray-400 hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <label className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-200 cursor-pointer">
          <Edit className="h-3 w-3" />
          {file ? "Changer" : existingUrl ? "Remplacer" : "Ajouter"}
          <input type="file" accept={accept} className="hidden" onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); }} />
        </label>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-gray-900">Modifier l'opérateur</h3>
            {!isAdmin && (
              <p className="text-xs text-amber-600 mt-0.5">⚠️ Votre modification sera soumise à validation admin</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Informations</p>
            <div className="grid grid-cols-2 gap-3">
              {EDIT_FIELDS.map(({ key, label }) => (
                <div key={key} className={key === "businessName" || key === "businessAddress" ? "col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Documents KYC</p>
            <div className="grid grid-cols-1 gap-4">
              <DocPicker label="RCCM"                   existingUrl={existingRccm}       file={rccmFile}       onFile={setRccmFile}       />
              <DocPicker label="Carte nationale"        existingUrl={existingNationalId} file={nationalIdFile} onFile={setNationalIdFile} />
              <DocPicker label="NIF (optionnel)"        existingUrl={existingNif}        file={nifFile}        onFile={setNifFile}        />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Photos de l'hôtel
                {newPhotos.length > 0 && <span className="ml-2 text-blue-600 normal-case font-normal">+{newPhotos.length} à ajouter</span>}
                {removedUrls.length > 0 && <span className="ml-2 text-red-500 normal-case font-normal">−{removedUrls.length} à supprimer</span>}
              </p>
              <span className="text-xs text-gray-400">{visiblePhotos.length + newPhotos.length} photo{visiblePhotos.length + newPhotos.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex gap-2 flex-wrap mb-3">
              {visiblePhotos.map((url, i) => (
                <div key={url} className="relative group">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                  <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button onClick={() => handleRemoveExisting(url)} disabled={removing === url}
                            className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-lg text-white">
                      {removing === url ? <Loader className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              ))}
              {newPhotos.map((file, i) => (
                <div key={i} className="relative group">
                  <img src={URL.createObjectURL(file)} alt={`New ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border-2 border-blue-400" />
                  <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => setNewPhotos((p) => p.filter((_, idx) => idx !== i))}
                            className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-lg text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="absolute top-1 left-1 px-1 py-0.5 bg-blue-500 text-white text-xs rounded font-bold leading-none">+</span>
                </div>
              ))}
              <label className="w-20 h-20 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer transition-colors">
                <Image className="h-5 w-5 mb-1" />
                <span className="text-xs">Ajouter</span>
                <input type="file" accept="image/*" multiple className="hidden"
                       onChange={(e) => { const files = Array.from(e.target.files || []); setNewPhotos((p) => [...p, ...files].slice(0, 10 - visiblePhotos.length)); }} />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Note {!isAdmin ? "(explique la raison)" : "(optionnelle)"}
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isAdmin ? "Note optionnelle..." : "Pourquoi cette modification ?"}
            />
          </div>
        </div>
        <div className="flex items-center justify-between p-5 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {[(rccmFile || nationalIdFile || nifFile) && "Docs KYC",
              newPhotos.length > 0 && `${newPhotos.length} photo${newPhotos.length > 1 ? "s" : ""} à ajouter`,
              removedUrls.length > 0 && `${removedUrls.length} supprimée${removedUrls.length > 1 ? "s" : ""}`,
            ].filter(Boolean).join(" · ") || "Aucune modification"}
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Annuler</button>
            <button onClick={handleSave} disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50">
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : isAdmin ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {loading ? "En cours..." : isAdmin ? "Appliquer" : "Soumettre"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Room Card ─────────────────────────────────────────────────
const RoomCard = ({ room }) => {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = room.images || [];
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <div className="relative h-36 bg-gray-200">
        {photos.length > 0 ? (
          <>
            <img src={photos[photoIdx]} alt={room.name} className="w-full h-full object-cover" />
            {photos.length > 1 && (
              <>
                <div className="absolute bottom-2 right-2 flex gap-1">
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIdx(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIdx ? "bg-white" : "bg-white/50"}`} />
                  ))}
                </div>
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/50 rounded text-white text-xs">
                  {photoIdx + 1}/{photos.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-8 w-8 text-gray-300" />
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${room.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
          {room.isActive ? "Actif" : "Inactif"}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-gray-900 text-sm">{room.name}</p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Bed className="h-3 w-3" /> {room.maxGuests} pers. · {room.totalRooms} ch.
          </div>
        </div>
        {room.nightlyRate && (
          <p className="text-sm font-semibold text-blue-600">${room.nightlyRate.price}<span className="text-xs text-gray-400 font-normal">/nuit</span></p>
        )}
        {room.customRates?.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {room.customRates.map((r, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">{r.label} · ${r.price}</span>
            ))}
          </div>
        )}
        {room.amenities?.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-2">
            {room.amenities.slice(0, 4).map((a, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{a}</span>
            ))}
            {room.amenities.length > 4 && <span className="text-xs text-gray-400">+{room.amenities.length - 4}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Location Card ─────────────────────────────────────────────
const LocationCard = ({ location }) => {
  const [expanded, setExpanded] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = [location.coverImage, ...(location.images || [])].filter(Boolean);
  const uniquePhotos = [...new Set(photos)];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="relative h-44 bg-gray-100">
        {uniquePhotos.length > 0 ? (
          <>
            <img src={uniquePhotos[photoIdx]} alt={location.name} className="w-full h-full object-cover" />
            {uniquePhotos.length > 1 && (
              <>
                <div className="absolute inset-0 flex items-center justify-between px-2">
                  <button onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))} className="p-1 bg-black/40 rounded-full text-white hover:bg-black/60">
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                  <button onClick={() => setPhotoIdx((i) => Math.min(uniquePhotos.length - 1, i + 1))} className="p-1 bg-black/40 rounded-full text-white hover:bg-black/60">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/50 rounded-full text-white text-xs">
                  {photoIdx + 1} / {uniquePhotos.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Hotel className="h-12 w-12 text-gray-300" /></div>
        )}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold ${location.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
          {location.isActive ? "Actif" : "Inactif"}
        </div>
        {location.rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/50 rounded-full text-white text-xs">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{location.rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-bold text-gray-900">{location.name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {[location.commune, location.ville, location.province].filter(Boolean).join(", ")}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            {location.startingPrice && (
              <p className="font-bold text-blue-600">${location.startingPrice}<span className="text-xs text-gray-400 font-normal">/nuit</span></p>
            )}
            <p className="text-xs text-gray-400">{location.activeRoomCount} chambre{location.activeRoomCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {location.amenities?.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {location.amenities.slice(0, 5).map((a, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{a}</span>
            ))}
            {location.amenities.length > 5 && <span className="text-xs text-gray-400">+{location.amenities.length - 5}</span>}
          </div>
        )}
        {location.phoneNumber && (
          <a href={`tel:${location.phoneNumber}`} className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 hover:text-blue-600">
            <Phone className="h-3.5 w-3.5" /> {location.phoneNumber}
          </a>
        )}
        {location.rooms?.length > 0 && (
          <button onClick={() => setExpanded(!expanded)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            <span>{location.rooms.length} type{location.rooms.length > 1 ? "s" : ""} de chambre{location.rooms.length > 1 ? "s" : ""}</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
        {expanded && (
          <div className="mt-3 grid grid-cols-1 gap-3">
            {location.rooms.map((room) => <RoomCard key={room.id} room={room} />)}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Operator Detail View ──────────────────────────────────────
const OperatorDetail = ({ operatorId, isAdmin, onBack, onRefresh }) => {
  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("info");
  const [actionModal,   setActionModal]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEdit,      setShowEdit]      = useState(false);
  const [error,         setError]         = useState("");

  const TABS = [
    { id: "info",    label: "Infos",       icon: User     },
    { id: "hotels",  label: "Hôtels",      icon: Hotel    },
    { id: "sub",     label: "Abonnement",  icon: DollarSign },
    { id: "history", label: "Historique",  icon: History  },
  ];

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hotelKycService.getDetail(operatorId);
      setData(res);
    } catch (e) {
      setError(e.response?.data?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [operatorId]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (reason) => {
    setError("");
    try {
      setActionLoading(true);
      if (actionModal === "suspend")   await hotelKycService.suspend(operatorId, reason);
      if (actionModal === "unsuspend") await hotelKycService.unsuspend(operatorId);
      if (actionModal === "ban")       await hotelKycService.ban(operatorId, reason);
      setActionModal(null);
      load();
      onRefresh?.();
    } catch (e) {
      setError(e.response?.data?.message || "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewEdit = async (requestId, action) => {
    const rejectionReason = action === "reject" ? prompt("Raison du rejet :") : undefined;
    if (action === "reject" && !rejectionReason) return;
    try {
      await hotelKycService.reviewEdit(requestId, action, rejectionReason);
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Erreur");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-16 text-gray-500">
      {error || "Opérateur introuvable"}
      <button onClick={onBack} className="block mx-auto mt-4 text-blue-600 text-sm">← Retour</button>
    </div>
  );

  const { account, locations, editHistory } = data;
  const isBanned    = account.status === "banned";
  const isSuspended = account.status === "suspended";
  const isActive    = account.status === "active";
  const pendingEdits = editHistory.filter((e) => e.status === "pending");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-900">{account.businessName}</h2>
            <StatusBadge status={account.status} />
            {account.pendingProfileReview && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                <Bell className="h-3 w-3" /> Révision en attente
              </span>
            )}
            {pendingEdits.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                <Edit className="h-3 w-3" /> {pendingEdits.length} modif. en attente
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{account.fullName} · {account.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setShowEdit(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
            <Edit className="h-4 w-4" />
            {isAdmin ? "Modifier" : "Proposer modification"}
          </button>
          {isActive && (
            <button onClick={() => setActionModal("suspend")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-100 border border-amber-200">
              <ShieldOff className="h-4 w-4" /> Suspendre
            </button>
          )}
          {isSuspended && (
            <button onClick={() => setActionModal("unsuspend")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 text-sm font-semibold rounded-xl hover:bg-green-100 border border-green-200">
              <Shield className="h-4 w-4" /> Lever
            </button>
          )}
          {isAdmin && !isBanned && (
            <button onClick={() => setActionModal("ban")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 text-sm font-semibold rounded-xl hover:bg-red-100 border border-red-200">
              <Ban className="h-4 w-4" /> Bannir
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon     = tab.icon;
          const tabActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                      tabActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}>
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "info" && account.pendingProfileReview && (
                <span className="ml-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full">!</span>
              )}
              {tab.id === "history" && pendingEdits.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">{pendingEdits.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Infos ─────────────────────────────────────────── */}
      {activeTab === "info" && (
        <div className="space-y-5">

          {/* ★ PENDING PROFILE REVIEW PANEL — shown first if active ★ */}
          {account.pendingProfileReview && (
            <PendingReviewPanel
              account={account}
              onResolved={() => { load(); onRefresh?.(); }}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left col */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informations</p>
                {[
                  { label: "Propriétaire",  value: account.fullName,       icon: User    },
                  { label: "Email",         value: account.email,          icon: Mail    },
                  { label: "Tél. perso",    value: account.phoneNumber,    icon: Phone   },
                  { label: "Tél. hôtel",    value: account.hotelPhoneNumber,icon: Phone  },
                  { label: "Adresse",       value: account.businessAddress,icon: MapPin  },
                  { label: "Localisation",  value: [account.commune, account.city, account.province].filter(Boolean).join(", "), icon: MapPin },
                  { label: "Membre depuis", value: fmt(account.createdAt), icon: Calendar},
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

              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Documents KYC</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "RCCM",  data: account.kyc?.rccm      },
                    { label: "Carte", data: account.kyc?.nationalId },
                    { label: "NIF",   data: account.kyc?.nif       },
                  ].map(({ label, data: doc }) => (
                    <a key={label} href={doc?.url || "#"} target="_blank" rel="noreferrer"
                       className={`flex flex-col items-center p-3 border-2 border-dashed rounded-xl text-center transition-colors ${
                         doc?.url ? "border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer" : "border-gray-200 bg-gray-50 opacity-40 pointer-events-none"
                       }`}>
                      <FileText className={`h-5 w-5 mb-1 ${doc?.url ? "text-blue-500" : "text-gray-400"}`} />
                      <p className="text-xs font-semibold text-gray-700">{label}</p>
                      <p className="text-xs text-gray-400">{doc?.url ? "Voir" : "N/A"}</p>
                    </a>
                  ))}
                </div>
                {account.kyc?.hotelPhotos?.urls?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Photos hôtel ({account.kyc.hotelPhotos.urls.length})</p>
                    <div className="flex gap-2 flex-wrap">
                      {account.kyc.hotelPhotos.urls.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt={`Photo ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                          <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <a href={url} target="_blank" rel="noreferrer" className="p-1 bg-white/20 hover:bg-white/40 rounded text-white" title="Voir">
                              <Eye className="h-3 w-3" />
                            </a>
                            <button onClick={() => downloadFile(url)} className="p-1 bg-white/20 hover:bg-white/40 rounded text-white" title="Télécharger">
                              <Download className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {account.kyc?.reviewedBy && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{account.status === "kyc_rejected" ? "Rejeté par" : "Approuvé par"}</p>
                      <p className="text-sm font-semibold text-gray-900">{account.kyc.reviewedBy.name}</p>
                      <p className="text-xs text-gray-400">{account.kyc.reviewedBy.role} · {fmt(account.kyc.reviewedAt)}</p>
                      {account.kyc.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1 italic">« {account.kyc.rejectionReason} »</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right col */}
            <div className="space-y-4">
              {(isSuspended || isBanned) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actions disciplinaires</p>
                  {isSuspended && account.suspendedBy && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <ShieldOff className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400">Suspendu par</p>
                        <p className="text-sm font-semibold text-gray-900">{account.suspendedBy.name}</p>
                        <p className="text-xs text-gray-400">{account.suspendedBy.role} · {fmt(account.suspendedAt)}</p>
                        {account.suspensionReason && <p className="text-xs text-amber-700 mt-1 italic">« {account.suspensionReason} »</p>}
                      </div>
                    </div>
                  )}
                  {isBanned && account.bannedBy && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                      <Ban className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400">Banni par</p>
                        <p className="text-sm font-semibold text-gray-900">{account.bannedBy.name}</p>
                        <p className="text-xs text-gray-400">{account.bannedBy.role} · {fmt(account.bannedAt)}</p>
                        {account.banReason && <p className="text-xs text-red-700 mt-1 italic">« {account.banReason} »</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Statistiques</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Hôtels",        value: account.hotelsCount                                             },
                    { label: "Staff",          value: account.staffCount                                              },
                    { label: "Jours restants", value: account.daysUntilExpiry || "—"                                 },
                    { label: "Essai gratuit",  value: account.freeTrialEnabled ? (account.freeTrialUsed ? "Utilisé" : "Actif") : "Non" },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Hôtels ────────────────────────────────────────── */}
      {activeTab === "hotels" && (
        <div>
          {locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-gray-200">
              <Hotel className="h-12 w-12 text-gray-300 mb-3" />
              <p className="font-semibold text-gray-700">Aucun hôtel enregistré</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {locations.map((loc) => <LocationCard key={loc.id} location={loc} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Abonnement ────────────────────────────────────── */}
      {activeTab === "sub" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Frais d'inscription</p>
            <div className="flex items-center gap-2">
              {account.registrationFeeWaived ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-bold rounded-xl">✅ Dispensé (promo: {account.promoCodeUsed})</span>
              ) : account.registrationFeePaid ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-bold rounded-xl">✅ Payé — ${account.registrationFeeAmount}</span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-bold rounded-xl">❌ Non payé — ${account.registrationFeeAmount}</span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Abonnement actuel</p>
            {account.freeTrialEnabled ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2"><Star className="h-4 w-4 text-purple-500" /><p className="font-semibold text-purple-700">Essai gratuit 1 an</p></div>
                <p className="text-sm text-gray-600">Début: {fmt(account.freeTrialStartedAt)}</p>
                <p className="text-sm text-gray-600">Fin: {fmt(account.freeTrialEndsAt)}</p>
                <p className="text-sm font-bold text-gray-900">{account.daysUntilExpiry} jours restants</p>
              </div>
            ) : account.subscription?.plan ? (
              <div className="space-y-2">
                <p className="font-semibold text-gray-900 capitalize">{account.subscription.plan.replace("_", " ")}</p>
                <p className="text-sm text-gray-600">Début: {fmt(account.subscription.startDate)}</p>
                <p className="text-sm text-gray-600">Expiration: {fmt(account.subscription.endDate)}</p>
                <p className="text-sm text-gray-600">Montant payé: <span className="font-bold">${account.subscription.amountPaid} {account.subscription.currency}</span></p>
                <p className="text-sm font-bold text-gray-900">{account.daysUntilExpiry} jours restants</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucun abonnement actif</p>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Historique ────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {isAdmin && pendingEdits.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-purple-800">⏳ {pendingEdits.length} modification{pendingEdits.length > 1 ? "s" : ""} en attente</p>
              {pendingEdits.map((e) => (
                <div key={e.id} className="bg-white rounded-xl border border-purple-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{e.requestedBy?.name} <span className="text-gray-400 font-normal text-xs">({e.requestedBy?.salesId})</span></p>
                      <p className="text-xs text-gray-400 mb-2">{fmtFull(e.requestedAt)}</p>
                      <div className="space-y-1">
                        {Object.entries(e.changes).map(([field, value]) => (
                          <div key={field} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 font-medium min-w-24">{EDIT_FIELDS.find((f) => f.key === field)?.label || field}:</span>
                            <span className="text-red-500 line-through">{e.previousValues?.[field] || "—"}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-700 font-semibold">{value}</span>
                          </div>
                        ))}
                      </div>
                      {e.note && <p className="text-xs text-gray-500 mt-2 italic">« {e.note} »</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleReviewEdit(e.id, "approve")}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">
                        <Check className="h-3.5 w-3.5" /> Approuver
                      </button>
                      <button onClick={() => handleReviewEdit(e.id, "reject")}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 border border-red-200">
                        <X className="h-3.5 w-3.5" /> Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {editHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 bg-white rounded-2xl border border-gray-200">
              <History className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Aucun historique</p>
            </div>
          ) : (
            <div className="space-y-2">
              {editHistory.map((e) => (
                <div key={e.id} className={`bg-white rounded-xl border p-4 ${e.status === "pending" ? "border-purple-200" : e.status === "approved" ? "border-green-200" : "border-red-200"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${e.status === "pending" ? "bg-purple-100" : e.status === "approved" ? "bg-green-100" : "bg-red-100"}`}>
                      {e.status === "approved" ? <Check className="h-4 w-4 text-green-600" /> : e.status === "rejected" ? <X className="h-4 w-4 text-red-600" /> : <Clock className="h-4 w-4 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-gray-900">{e.requestedBy?.name || "Admin"} {e.requestedBy?.salesId && <span className="text-gray-400 font-normal text-xs">({e.requestedBy.salesId})</span>}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${e.status === "pending" ? "bg-purple-100 text-purple-700" : e.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {e.status === "pending" ? "En attente" : e.status === "approved" ? "Approuvé" : "Rejeté"}
                        </span>
                        <span className="text-xs text-gray-400">{fmtFull(e.requestedAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(e.changes).map(([field, value]) => (
                          <span key={field} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-700">
                            <span className="text-gray-400">{EDIT_FIELDS.find((f) => f.key === field)?.label || field}:</span>{" "}
                            {String(e.previousValues?.[field] || "—")} → <span className="font-semibold">{String(value)}</span>
                          </span>
                        ))}
                      </div>
                      {e.note && <p className="text-xs text-gray-400 mt-1 italic">« {e.note} »</p>}
                      {e.reviewedBy && (
                        <p className="text-xs text-gray-400 mt-1">
                          {e.status === "approved" ? "Approuvé" : "Rejeté"} par <span className="font-medium">{e.reviewedBy.name}</span> · {fmt(e.reviewedAt)}
                          {e.rejectionReason && <span className="text-red-500"> — « {e.rejectionReason} »</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {actionModal && (
        <ActionModal action={actionModal} operator={account} loading={actionLoading} onConfirm={handleAction} onClose={() => setActionModal(null)} />
      )}
      {showEdit && (
        <EditModal
          operator={{ ...account, id: account.id }}
          isAdmin={isAdmin}
          onClose={() => setShowEdit(false)}
          onSave={() => { setShowEdit(false); load(); onRefresh?.(); }}
        />
      )}
    </div>
  );
};

// ── Main Tab Component (List View) ────────────────────────────
const HotelOperatorsTab = () => {
  const [operators,    setOperators]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);
  const [selectedId,   setSelectedId]   = useState(null);

  const currentUser = apiHelpers.getCurrentUser();
  const isAdmin = currentUser?.type === "admin" ||
    ["ceo","super_admin","admin","regional_manager","sales_manager","team_leader"].includes(currentUser?.role);

  const load = useCallback(async (p = 1, s = search, sf = statusFilter) => {
    try {
      setLoading(true);
      setError("");
      const data = await hotelKycService.getAll({ page: p, limit: 20, search: s || undefined, status: sf || undefined });
      setOperators(data.accounts || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.total || 0);
      setPage(p);
    } catch (e) {
      setError(e.response?.data?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(1, search, statusFilter), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  if (selectedId) {
    return (
      <OperatorDetail
        operatorId={selectedId}
        isAdmin={isAdmin}
        onBack={() => setSelectedId(null)}
        onRefresh={() => load(page, search, statusFilter)}
      />
    );
  }

  const counts = operators.reduce((acc, op) => {
    acc[op.status] = (acc[op.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Opérateurs hôteliers</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Chargement..." : `${total} opérateur${total !== 1 ? "s" : ""} au total`}
          </p>
        </div>
        <button onClick={() => load(page, search, statusFilter)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      {!loading && total > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Actifs",     value: counts.active || 0,     color: "border-green-200 bg-green-50 text-green-700"  },
            { label: "KYC",        value: counts.kyc_submitted || 0, color: "border-blue-200 bg-blue-50 text-blue-700"  },
            { label: "Suspendus",  value: counts.suspended || 0,  color: "border-amber-200 bg-amber-50 text-amber-700"  },
            { label: "Bannis",     value: counts.banned || 0,     color: "border-red-200 bg-red-50 text-red-700"        },
          ].map((s) => (
            <div key={s.label} className={`border rounded-2xl p-3 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          {ALL_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
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
      ) : operators.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-gray-200">
          <Building2 className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">Aucun opérateur trouvé</p>
          <p className="text-sm text-gray-400 mt-1">{search || statusFilter ? "Modifiez vos filtres." : "Les opérateurs apparaîtront ici."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {operators.map((op) => (
            <button
              key={op.id}
              onClick={() => setSelectedId(op.id)}
              className={`w-full bg-white border rounded-2xl p-4 flex items-center gap-4 hover:shadow-sm transition-all text-left group ${
                op.pendingProfileReview
                  ? "border-orange-300 hover:border-orange-400"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  op.pendingProfileReview
                    ? "bg-gradient-to-br from-orange-400 to-orange-600"
                    : "bg-gradient-to-br from-blue-500 to-blue-700"
                }`}>
                  <span className="text-white text-lg font-bold">{op.businessName?.[0] || "?"}</span>
                </div>
                {/* Orange dot for pending review */}
                {op.pendingProfileReview && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 border-2 border-white rounded-full" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-bold text-gray-900 text-sm">{op.businessName}</p>
                  <StatusBadge status={op.status} />
                  {op.pendingProfileReview && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                      <Bell className="h-3 w-3" /> Révision
                    </span>
                  )}
                  {op.freeTrialEnabled && !op.freeTrialUsed && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                      <Star className="h-3 w-3" /> Essai
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-500"><User className="h-3 w-3" />{op.fullName}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500"><Mail className="h-3 w-3" />{op.email}</span>
                  {op.phoneNumber && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone className="h-3 w-3" />{op.phoneNumber}</span>}
                  <span className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="h-3 w-3" />{fmt(op.createdAt)}</span>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500">{op.hotelsCount} hôtel{op.hotelsCount !== 1 ? "s" : ""}</p>
                  {op.subscription?.plan && (
                    <p className="text-xs text-blue-600 font-medium">{op.subscription.plan.replace("_", " ")}</p>
                  )}
                </div>
                <ChevronRight className={`h-4 w-4 transition-colors ${op.pendingProfileReview ? "text-orange-400 group-hover:text-orange-600" : "text-gray-300 group-hover:text-blue-500"}`} />
              </div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => load(page - 1, search, statusFilter)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">
            Précédent
          </button>
          <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => load(page + 1, search, statusFilter)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default HotelOperatorsTab;
