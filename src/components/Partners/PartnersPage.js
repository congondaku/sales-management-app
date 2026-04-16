import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2,
  Edit2, Check, X, AlertTriangle, Building2, Tag,
} from 'lucide-react';
import PartnerQueue from './PartnerQueue';
import PartnerDetail from './PartnerDetail';
import apiClient from '../../services/api';

// ─── Category Manager ─────────────────────────────────────────
const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // null | category object
  const [form, setForm] = useState({ name: '', nameFr: '', icon: '', order: 0 });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null); // id being deleted

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/amenities/admin/categories');
      setCategories(res.data.categories || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', nameFr: '', icon: '', order: 0 });
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, nameFr: cat.nameFr || '', icon: cat.icon || '', order: cat.order || 0 });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Le nom est requis.');
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await apiClient.put(`/amenities/admin/categories/${editing._id}`, form);
        showToast('Catégorie mise à jour.');
      } else {
        await apiClient.post('/amenities/admin/categories', form);
        showToast('Catégorie créée.');
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cat) => {
    try {
      await apiClient.patch(`/amenities/admin/categories/${cat._id}/toggle`);
      showToast(cat.isActive ? 'Catégorie désactivée.' : 'Catégorie activée.');
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur.', 'error');
    }
  };

  const handleDelete = async (cat) => {
    if (!cat.canDelete) return;
    if (!window.confirm(`Supprimer définitivement "${cat.nameFr || cat.name}" ?`)) return;
    setDeleting(cat._id);
    try {
      await apiClient.delete(`/amenities/admin/categories/${cat._id}`);
      showToast('Catégorie supprimée.');
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Suppression impossible.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Catégories</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Chargement...' : `${categories.length} catégorie${categories.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle catégorie
          </button>
        </div>
      </div>

      {error && !showForm && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white border border-orange-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            {editing ? `Modifier — ${editing.nameFr || editing.name}` : 'Nouvelle catégorie'}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Nom (interne) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Restaurant"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Nom affiché (français)
              </label>
              <input
                type="text"
                value={form.nameFr}
                onChange={e => setForm(f => ({ ...f, nameFr: e.target.value }))}
                placeholder="Restaurant"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Icône (emoji)
              </label>
              <input
                type="text"
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="🍽️"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Ordre d'affichage
              </label>
              <input
                type="number"
                value={form.order}
                onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => { setShowForm(false); setEditing(null); setError(''); }}
              disabled={saving}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl disabled:opacity-50"
            >
              {saving
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Sauvegarde...</>
                : <><Check className="h-4 w-4" /> {editing ? 'Mettre à jour' : 'Créer'}</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Category list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-gray-200">
          <Tag className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">Aucune catégorie</p>
          <p className="text-sm text-gray-400 mt-1">Créez la première catégorie.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <div
              key={cat._id}
              className={`bg-white border rounded-2xl p-4 flex items-center gap-4 transition-all ${cat.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
                }`}
            >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.isActive ? 'bg-orange-50' : 'bg-gray-100'
                }`}>
                {cat.icon && /\p{Emoji}/u.test(cat.icon)
                  ? <span className="text-xl">{cat.icon}</span>
                  : <span className="text-sm font-bold text-orange-500 uppercase">
                    {(cat.nameFr || cat.name)?.charAt(0)}
                  </span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900 text-sm">{cat.nameFr || cat.name}</p>
                  {!cat.isActive && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                      Inactif
                    </span>
                  )}
                  {cat.partnerCount > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full font-semibold">
                      {cat.partnerCount} partenaire{cat.partnerCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Ordre: {cat.order ?? 0}
                  {cat.name !== cat.nameFr && ` · ${cat.name}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Edit */}
                <button
                  onClick={() => openEdit(cat)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                {/* Toggle active */}
                <button
                  onClick={() => handleToggle(cat)}
                  className={`p-2 rounded-lg transition-colors ${cat.isActive
                      ? 'hover:bg-orange-50 text-orange-500'
                      : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                    }`}
                  title={cat.isActive ? 'Désactiver' : 'Activer'}
                >
                  {cat.isActive
                    ? <ToggleRight className="h-5 w-5" />
                    : <ToggleLeft className="h-5 w-5" />
                  }
                </button>

                {/* Delete — only if zero partners */}
                {cat.canDelete ? (
                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={deleting === cat._id}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deleting === cat._id
                      ? <RefreshCw className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />
                    }
                  </button>
                ) : (
                  <div
                    className="p-2 rounded-lg text-gray-200 cursor-not-allowed"
                    title="Impossible de supprimer — des partenaires utilisent cette catégorie"
                  >
                    <Trash2 className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Les catégories avec des partenaires ne peuvent pas être supprimées — désactivez-les à la place.
          Les catégories inactives n'apparaissent pas dans l'app.
        </p>
      </div>
    </div>
  );
};

// ─── Main Partners Page ───────────────────────────────────────
const PartnersPage = () => {
  const [tab, setTab] = useState('demandes'); // 'demandes' | 'categories'
  const [selected, setSelected] = useState(null);

  // If viewing a partner detail, full-page override
  if (selected) {
    return (
      <PartnerDetail
        partner={selected}
        onBack={() => setSelected(null)}
        onReviewed={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
        <button
          onClick={() => setTab('demandes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'demandes'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Building2 className="h-4 w-4" />
          Demandes
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'categories'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Tag className="h-4 w-4" />
          Catégories
        </button>
      </div>

      {/* Tab content */}
      {tab === 'demandes' && (
        <PartnerQueue onSelectPartner={(p) => setSelected(p)} />
      )}
      {tab === 'categories' && (
        <CategoryManager />
      )}
    </div>
  );
};

export default PartnersPage;
