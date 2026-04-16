import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Send, Clock, CheckCircle, XCircle,
  RefreshCw, Plus, ChevronDown, ChevronUp, Trash2, Users, Star,
} from 'lucide-react';
import apiClient from '../../services/api';

// ─── Reminder templates ───────────────────────────────────────
const TEMPLATES = [
  {
    id: 'comeback',
    label: 'Reviens nous voir 👋',
    title: 'On a du nouveau pour toi !',
    body: 'De nouvelles annonces viennent d\'être publiées dans ta zone. Viens voir ce qui t\'attend !',
  },
  {
    id: 'partner_promo',
    label: 'Promo partenaires 🏪',
    title: 'Des commerces près de chez toi',
    body: 'Découvre les partenaires Congo Ndaku dans ton quartier — restaurants, pharmacies, boutiques et plus.',
  },
  {
    id: 'new_listings',
    label: 'Nouvelles annonces 🏠',
    title: 'Nouvelles propriétés disponibles',
    body: 'Plusieurs nouvelles annonces ont été publiées. Trouve ton prochain chez-toi dès maintenant !',
  },
  {
    id: 'weekend',
    label: 'Rappel weekend 📅',
    title: 'Ce weekend, trouve ton logement',
    body: 'Tu cherches un appartement ou une maison ? Ce weekend est le bon moment pour explorer nos annonces.',
  },
  {
    id: 'hotel',
    label: 'Courts séjours 🛏️',
    title: 'Besoin d\'un court séjour ?',
    body: 'Congo Ndaku propose des hôtels et locations journalières partout à Kinshasa. Réserve en quelques clics !',
  },
];

const STATUS_CONFIG = {
  scheduled: { label: 'Planifiée',  bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Clock },
  sending:   { label: 'En cours',   bg: 'bg-yellow-100', text: 'text-yellow-700', icon: RefreshCw },
  sent:      { label: 'Envoyée',    bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle },
  failed:    { label: 'Échouée',    bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle },
  cancelled: { label: 'Annulée',    bg: 'bg-gray-100',   text: 'text-gray-500',   icon: XCircle },
};

const TARGET_OPTIONS = [
  { value: 'all',      label: 'Tous les utilisateurs', icon: Users },
  { value: 'partners', label: 'Partenaires approuvés', icon: Star },
];

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const StatusBadge = ({ status }) => {
  const cfg  = STATUS_CONFIG[status] || STATUS_CONFIG.sent;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

// ─── Compose form ─────────────────────────────────────────────
const ComposeForm = ({ onSent, prefill }) => {
  const [title,       setTitle]       = useState('');
  const [body,        setBody]        = useState('');
  const [targetType,  setTargetType]  = useState('all');
  const [scheduled,   setScheduled]   = useState(false);
  const [schedDate,   setSchedDate]   = useState('');
  const [schedTime,   setSchedTime]   = useState('');
  const [sending,     setSending]     = useState(false);
  const [error,       setError]       = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  // Apply prefill when it changes (edit & resend from history)
  useEffect(() => {
    if (prefill) {
      setTitle(prefill.title || '');
      setBody(prefill.body || '');
      setTargetType(prefill.targetType || 'all');
      setScheduled(false);
      setSchedDate(''); setSchedTime('');
    }
  }, [prefill]);

  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    setShowTemplates(false);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return setError('Titre et message requis.');
    if (scheduled && (!schedDate || !schedTime)) return setError('Choisissez une date et heure.');

    setSending(true); setError('');
    try {
      let scheduledFor = null;
      if (scheduled) scheduledFor = new Date(`${schedDate}T${schedTime}`).toISOString();

      await apiClient.post('/notifications/broadcast', {
        title: title.trim(),
        body:  body.trim(),
        targetType,
        scheduledFor,
      });

      setTitle(''); setBody(''); setScheduled(false); setSchedDate(''); setSchedTime('');
      onSent?.();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally {
      setSending(false);
    }
  };

  const charCount = body.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Plus className="h-5 w-5 text-orange-500" />
          {prefill ? 'Modifier & renvoyer' : 'Nouvelle notification'}
        </h2>
        <button
          onClick={() => setShowTemplates(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
        >
          Modèles
          {showTemplates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Template picker */}
      {showTemplates && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-orange-50 rounded-xl">
          {TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => applyTemplate(tpl)}
              className="text-left px-4 py-3 bg-white border border-orange-100 rounded-xl hover:border-orange-300 hover:shadow-sm transition-all"
            >
              <p className="text-sm font-semibold text-gray-800">{tpl.label}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tpl.title}</p>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Titre</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={65}
          placeholder="Ex: On a du nouveau pour toi !"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/65</p>
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={178}
          rows={3}
          placeholder="Le texte de votre notification..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
        <p className={`text-xs mt-1 text-right ${charCount > 150 ? 'text-orange-500' : 'text-gray-400'}`}>
          {charCount}/178
        </p>
      </div>

      {/* Target */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Destinataires</label>
        <div className="flex gap-3">
          {TARGET_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setTargetType(opt.value)}
                className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                  targetType === opt.value
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScheduled(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
            scheduled
              ? 'border-blue-400 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <Clock className="h-4 w-4" />
          {scheduled ? 'Planifiée' : 'Planifier'}
        </button>

        {scheduled && (
          <div className="flex gap-2 flex-1">
            <input
              type="date"
              value={schedDate}
              onChange={e => setSchedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="time"
              value={schedTime}
              onChange={e => setSchedTime(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        )}
      </div>

      {/* Preview */}
      {(title || body) && (
        <div className="p-4 bg-gray-900 rounded-2xl">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Aperçu</p>
          <div className="bg-white rounded-xl p-3 flex gap-3 items-start">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{title || '...'}</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{body || '...'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={sending || !title.trim() || !body.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
      >
        {sending
          ? <><RefreshCw className="h-4 w-4 animate-spin" /> Envoi en cours...</>
          : scheduled
            ? <><Clock className="h-4 w-4" /> Planifier</>
            : <><Send className="h-4 w-4" /> Envoyer maintenant</>
        }
      </button>
    </div>
  );
};

// ─── History ──────────────────────────────────────────────────
const NotificationHistory = ({ refresh, onEditResend }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [actionId,      setActionId]      = useState(null); // id being acted on
  const [resending,     setResending]     = useState(null);
  const [error,         setError]         = useState('');

  const load = useCallback(async (p = 1) => {
    setLoading(true); setError('');
    try {
      const res = await apiClient.get(`/notifications/history?page=${p}&limit=15`);
      setNotifications(res.data.notifications || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setPage(p);
    } catch {
      setError('Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load, refresh]);

  // Delete (hard delete for sent/failed/cancelled, cancel for scheduled)
  const handleDelete = async (notif) => {
    const msg = notif.status === 'scheduled'
      ? 'Annuler cette notification planifiée ?'
      : "Supprimer cette notification de l'historique ?";
    if (!window.confirm(msg)) return;
    setActionId(notif._id);
    try {
      await apiClient.delete(`/notifications/${notif._id}`);
      load(page);
    } catch (e) {
      alert(e.response?.data?.message || 'Impossible de supprimer.');
    } finally {
      setActionId(null);
    }
  };

  // Resend immediately as-is
  const handleResend = async (notif) => {
    if (!window.confirm(`Renvoyer "${notif.title}" maintenant ?`)) return;
    setResending(notif._id);
    try {
      await apiClient.post('/notifications/broadcast', {
        title:      notif.title,
        body:       notif.body,
        targetType: notif.targetType,
        data:       notif.data || {},
      });
      alert(`Notification renvoyée !`);
      load(page);
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors du renvoi.');
    } finally {
      setResending(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-400" />
          Historique
        </h2>
        <button onClick={() => load(page)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
          <Bell className="h-10 w-10 mb-2 text-gray-300" />
          <p className="text-sm font-medium">Aucune notification envoyée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n._id} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors space-y-3">

              {/* Top row: icon + content */}
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.status === 'sent'      ? 'bg-green-50' :
                  n.status === 'scheduled' ? 'bg-blue-50'  :
                  n.status === 'failed'    ? 'bg-red-50'   : 'bg-gray-50'
                }`}>
                  <Bell className={`h-4 w-4 ${
                    n.status === 'sent'      ? 'text-green-500' :
                    n.status === 'scheduled' ? 'text-blue-500'  :
                    n.status === 'failed'    ? 'text-red-500'   : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-bold text-gray-900 text-sm">{n.title}</p>
                    <StatusBadge status={n.status} />
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                      {n.targetType === 'all' ? 'Tous' : n.targetType === 'partners' ? 'Partenaires' : 'Spécifique'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-1">{n.body}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    {n.status === 'scheduled' && n.scheduledFor && (
                      <span className="flex items-center gap-1 text-blue-600 font-semibold">
                        <Clock className="h-3 w-3" />{fmt(n.scheduledFor)}
                      </span>
                    )}
                    {n.status === 'sent' && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {n.sentCount} envoyée{n.sentCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span>{fmt(n.createdAt)}</span>
                    {n.sentBy?.firstName && <span>par {n.sentBy.firstName} {n.sentBy.lastName}</span>}
                  </div>
                </div>
              </div>

              {/* Action buttons row */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                {/* Resend now */}
                <button
                  onClick={() => handleResend(n)}
                  disabled={resending === n._id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {resending === n._id
                    ? <RefreshCw className="h-3 w-3 animate-spin" />
                    : <Send className="h-3 w-3" />
                  }
                  Renvoyer
                </button>

                {/* Edit & resend */}
                <button
                  onClick={() => onEditResend(n)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Modifier & renvoyer
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(n)}
                  disabled={actionId === n._id}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {actionId === n._id
                    ? <RefreshCw className="h-3 w-3 animate-spin" />
                    : <Trash2 className="h-3 w-3" />
                  }
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button disabled={page <= 1} onClick={() => load(page - 1)}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">
            Précédent
          </button>
          <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => load(page + 1)}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────
const NotificationsPage = () => {
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [editingNotif, setEditingNotif] = useState(null); // prefill compose from history

  // When user clicks "Modifier & renvoyer" — prefill ComposeForm
  const handleEditResend = (notif) => {
    setEditingNotif({
      title:      notif.title,
      body:       notif.body,
      targetType: notif.targetType,
    });
    // Scroll to top so they see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">
          Créez, planifiez et suivez vos notifications push.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ComposeForm
          prefill={editingNotif}
          onSent={() => { setRefreshKey(k => k + 1); setEditingNotif(null); }}
        />
        <NotificationHistory
          refresh={refreshKey}
          onEditResend={handleEditResend}
        />
      </div>
    </div>
  );
};

export default NotificationsPage;
