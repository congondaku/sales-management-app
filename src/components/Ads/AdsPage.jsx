import React, { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Trash2, Edit3, ToggleLeft, ToggleRight,
  ExternalLink, Phone, MessageCircle, Link, Smartphone,
  Calendar, Clock, Star, AlertCircle, CheckCircle, X, Save,
  Eye, EyeOff, Image, ChevronDown, ChevronUp
} from 'lucide-react';
import apiClient from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const CTA_TYPES = [
  { value: 'call',      label: 'Appel téléphonique', icon: Phone },
  { value: 'whatsapp',  label: 'WhatsApp',            icon: MessageCircle },
  { value: 'link',      label: 'Lien externe',         icon: Link },
  { value: 'internal',  label: 'Écran interne',        icon: Smartphone },
];

const EMPTY_FORM = {
  advertiser: '',
  logo: '',
  message: '',
  ctaLabel: 'En savoir plus',
  ctaType: 'call',
  ctaValue: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  priority: 5,
  displayDurationSeconds: 10,
  isActive: true,
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ ad }) => {
  const now = new Date();
  const started = new Date(ad.startDate) <= now;
  const ended = ad.endDate && new Date(ad.endDate) < now;
  
  if (!ad.isActive) return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      <EyeOff className="h-3 w-3" /> Inactif
    </span>
  );
  if (ended) return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
      <AlertCircle className="h-3 w-3" /> Expiré
    </span>
  );
  if (!started) return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-600">
      <Clock className="h-3 w-3" /> Planifié
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-600">
      <CheckCircle className="h-3 w-3" /> En ligne
    </span>
  );
};

// ─── Ad Form Modal ────────────────────────────────────────────────────────────

const AdFormModal = ({ ad, onClose, onSave }) => {
  const [form, setForm]       = useState(ad ? { ...ad, startDate: ad.startDate?.slice(0,10), endDate: ad.endDate?.slice(0,10) || '' } : { ...EMPTY_FORM });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    if (!form.advertiser.trim()) return setError('Le nom de l\'annonceur est requis.');
    if (!form.message.trim())    return setError('Le message est requis.');
    if (!form.ctaValue.trim())   return setError('La valeur du CTA est requise.');
    setError('');
    try {
      setSaving(true);
      if (ad?._id) {
        await apiClient.patch(`/ads/${ad._id}`, form);
      } else {
        await apiClient.post('/ads', form);
      }
      onSave();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const CtaIcon = CTA_TYPES.find(c => c.value === form.ctaType)?.icon || Phone;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {ad ? 'Modifier la publicité' : 'Nouvelle publicité'}
              </h2>
              <p className="text-sm text-gray-500">Visible sur l'application mobile Congo Ndaku</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Advertiser + Logo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Annonceur *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Vodacom, MTN..."
                value={form.advertiser}
                onChange={e => set('advertiser', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL du logo</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
                value={form.logo}
                onChange={e => set('logo', e.target.value)}
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Message défilant * <span className="text-gray-400 font-normal">({form.message.length}/200)</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              maxLength={200}
              placeholder="Le message qui défile sur la bannière..."
              value={form.message}
              onChange={e => set('message', e.target.value)}
            />
          </div>

          {/* CTA */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Bouton d'action (CTA)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Label du bouton</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Appeler, Voir plus..."
                  value={form.ctaLabel}
                  onChange={e => set('ctaLabel', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.ctaType}
                  onChange={e => set('ctaType', e.target.value)}
                >
                  {CTA_TYPES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {form.ctaType === 'call' || form.ctaType === 'whatsapp' ? 'Numéro de téléphone *' :
                 form.ctaType === 'link' ? 'URL *' : 'Nom de l\'écran *'}
              </label>
              <div className="relative">
                <CtaIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    form.ctaType === 'call' || form.ctaType === 'whatsapp' ? '+243...' :
                    form.ctaType === 'link' ? 'https://...' : 'Ex: HotelDetail'
                  }
                  value={form.ctaValue}
                  onChange={e => set('ctaValue', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Dates + Duration + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date de début</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date de fin <span className="text-gray-400 font-normal">(vide = indéfini)</span></label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Durée d'affichage: <span className="text-blue-600">{form.displayDurationSeconds}s</span>
              </label>
              <input
                type="range" min={5} max={30} step={1}
                className="w-full accent-blue-600"
                value={form.displayDurationSeconds}
                onChange={e => set('displayDurationSeconds', Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5s</span><span>30s</span></div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Priorité: <span className="text-blue-600">{form.priority}/10</span>
              </label>
              <input
                type="range" min={1} max={10} step={1}
                className="w-full accent-blue-600"
                value={form.priority}
                onChange={e => set('priority', Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Faible</span><span>Haute</span></div>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-700">Activer immédiatement</p>
              <p className="text-xs text-gray-500">La publicité sera visible sur l'app dès la sauvegarde</p>
            </div>
            <button
              onClick={() => set('isActive', !form.isActive)}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Sauvegarde...' : ad ? 'Mettre à jour' : 'Créer la publicité'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Ad Card ──────────────────────────────────────────────────────────────────

const AdCard = ({ ad, onEdit, onToggle, onDelete }) => {
  const CtaIcon = CTA_TYPES.find(c => c.value === ad.ctaType)?.icon || Phone;
  const ctaLabel = CTA_TYPES.find(c => c.value === ad.ctaType)?.label || '';

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md ${ad.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      {/* Preview strip */}
      <div className="relative h-16 rounded-t-2xl overflow-hidden bg-gradient-to-r from-blue-900 to-blue-700 flex items-center px-4 gap-3">
        {ad.logo && (
          <img src={ad.logo} alt="" className="w-8 h-8 rounded-lg object-cover opacity-30 absolute inset-0 w-full h-full" style={{ objectFit: 'cover', filter: 'blur(4px)' }} />
        )}
        <div className="relative z-10 flex items-center gap-3 w-full">
          <div>
            <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider">{ad.advertiser}</p>
            <p className="text-white text-xs font-medium truncate max-w-xs">{ad.message}</p>
          </div>
          <div className="ml-auto flex-shrink-0 bg-white text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
            <CtaIcon className="h-3 w-3" />
            {ad.ctaLabel}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900">{ad.advertiser}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{ctaLabel} · {ad.ctaValue}</p>
          </div>
          <StatusBadge ad={ad} />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-400">Priorité</p>
            <p className="text-sm font-bold text-gray-800 flex items-center justify-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" /> {ad.priority}/10
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-400">Durée</p>
            <p className="text-sm font-bold text-gray-800">{ad.displayDurationSeconds}s</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-400">Fin</p>
            <p className="text-sm font-bold text-gray-800">
              {ad.endDate ? new Date(ad.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '∞'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(ad)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              ad.isActive ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {ad.isActive ? <><EyeOff className="h-3.5 w-3.5" /> Désactiver</> : <><Eye className="h-3.5 w-3.5" /> Activer</>}
          </button>
          <button
            onClick={() => onEdit(ad)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" /> Modifier
          </button>
          <button
            onClick={() => onDelete(ad)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdsPage = () => {
  const [ads, setAds]             = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [filter, setFilter]       = useState('all'); // all | active | inactive | expired
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/ads/all');
      setAds(res.data?.data || []);
    } catch (e) {
      console.error('AdsPage fetch:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const handleToggle = async (ad) => {
    try {
      await apiClient.patch(`/ads/${ad._id}/toggle`);
      fetchAds();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeleting(true);
      await apiClient.delete(`/ads/${deleteConfirm._id}`);
      setDeleteConfirm(null);
      fetchAds();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  const handleEdit = (ad) => { setEditingAd(ad); setShowModal(true); };
  const handleNew  = () => { setEditingAd(null); setShowModal(true); };
  const handleSave = () => { setShowModal(false); setEditingAd(null); fetchAds(); };

  const now = new Date();
  const filteredAds = ads.filter(ad => {
    if (filter === 'active')   return ad.isActive && (!ad.endDate || new Date(ad.endDate) > now);
    if (filter === 'inactive') return !ad.isActive;
    if (filter === 'expired')  return ad.endDate && new Date(ad.endDate) < now;
    return true;
  });

  const stats = {
    total:    ads.length,
    active:   ads.filter(a => a.isActive && (!a.endDate || new Date(a.endDate) > now)).length,
    inactive: ads.filter(a => !a.isActive).length,
    expired:  ads.filter(a => a.endDate && new Date(a.endDate) < now).length,
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Megaphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Publicités</h1>
            <p className="text-sm text-gray-500">Gérez les bannières publicitaires de l'application</p>
          </div>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Nouvelle publicité
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total',    value: stats.total,    color: 'bg-gray-50 border-gray-200',   text: 'text-gray-900' },
          { label: 'En ligne', value: stats.active,   color: 'bg-green-50 border-green-200', text: 'text-green-700' },
          { label: 'Inactifs', value: stats.inactive, color: 'bg-gray-50 border-gray-200',   text: 'text-gray-600' },
          { label: 'Expirés',  value: stats.expired,  color: 'bg-red-50 border-red-200',     text: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} border rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {[
          { key: 'all',      label: `Toutes (${stats.total})` },
          { key: 'active',   label: `En ligne (${stats.active})` },
          { key: 'inactive', label: `Inactives (${stats.inactive})` },
          { key: 'expired',  label: `Expirées (${stats.expired})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              filter === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ads grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Megaphone className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Aucune publicité trouvée</p>
          <p className="text-sm text-gray-400">Créez votre première publicité pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAds.map(ad => (
            <AdCard
              key={ad._id}
              ad={ad}
              onEdit={handleEdit}
              onToggle={handleToggle}
              onDelete={setDeleteConfirm}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <AdFormModal
          ad={editingAd}
          onClose={() => { setShowModal(false); setEditingAd(null); }}
          onSave={handleSave}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Supprimer la publicité</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              Voulez-vous vraiment supprimer la pub de <strong>{deleteConfirm.advertiser}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60">
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsPage;
