import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, X, RefreshCw, CheckCircle, Clock, XCircle,
  Copy, Check, ExternalLink, DollarSign, Mail, Phone, MessageCircle,
  Calendar, AlertCircle, Ban, Wallet, User
} from 'lucide-react';
import { invoiceService } from '../../services/invoice.service';
import { apiHelpers } from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: '',          label: 'Toutes' },
  { value: 'pending',   label: 'En attente' },
  { value: 'paid',      label: 'Payées' },
  { value: 'cancelled', label: 'Annulées' },
];

const CURRENCIES = ['USD', 'CDF'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatAmount = (amount, currency) => {
  if (amount == null) return '—';
  return currency === 'CDF'
    ? `${Number(amount).toLocaleString()} FC`
    : `$${Number(amount).toLocaleString()}`;
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isOverdue = (invoice) =>
  invoice.status === 'pending' && invoice.dueDate && new Date(invoice.dueDate) < new Date();

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ invoice }) => {
  if (invoice.status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
        <CheckCircle className="h-3 w-3" /> Payée
      </span>
    );
  }
  if (invoice.status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
        <XCircle className="h-3 w-3" /> Annulée
      </span>
    );
  }
  if (isOverdue(invoice)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
        <AlertCircle className="h-3 w-3" /> En retard
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
      <Clock className="h-3 w-3" /> En attente
    </span>
  );
};

// ─── Copy-to-clipboard link chip ──────────────────────────────────────────────

const PaymentLinkChip = ({ url, phone, recipientName }) => {
  const [copied, setCopied] = useState(false);
  const waPhone = phone?.replace(/[^0-9]/g, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — fine, the link is still visible/selectable
    }
  };

  const waMessage = encodeURIComponent(
    `Bonjour${recipientName ? ' ' + recipientName : ''}, voici votre lien de paiement : ${url}`
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <ExternalLink className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
        <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-700 truncate flex-1 hover:underline">
          {url}
        </a>
        <button onClick={handleCopy} className="flex-shrink-0 p-1 hover:bg-blue-100 rounded transition-colors" title="Copier le lien">
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-blue-500" />}
        </button>
      </div>
      {waPhone && (
        <a href={`https://wa.me/${waPhone}?text=${waMessage}`} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">
          <MessageCircle className="h-3.5 w-3.5" /> Envoyer sur WhatsApp
        </a>
      )}
    </div>
  );
};

// ─── Invoice Row ──────────────────────────────────────────────────────────────

const InvoiceRow = ({ invoice, onRefresh }) => {
  const [cancelling, setCancelling] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Annuler cette facture ?')) return;
    try {
      setCancelling(true);
      await invoiceService.cancelInvoice(invoice._id);
      onRefresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleMarkPaidCash = async () => {
    if (!window.confirm('Marquer cette facture comme payée en espèces / hors Yogue Pay ?')) return;
    try {
      setMarkingPaid(true);
      await invoiceService.markPaidCash(invoice._id);
      onRefresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setMarkingPaid(false);
    }
  };

  const borderColor = invoice.status === 'paid'
    ? 'border-l-green-400'
    : invoice.status === 'cancelled'
    ? 'border-l-gray-300'
    : isOverdue(invoice)
    ? 'border-l-red-400'
    : 'border-l-amber-400';

  return (
    <div className={`bg-white border rounded-xl p-4 transition-all hover:shadow-sm border-l-4 ${borderColor}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">{invoice.recipientName}</span>
            <StatusBadge invoice={invoice} />
            {invoice.createdBy && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full ${
                invoice.createdBy.type === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <User className="h-3 w-3" />
                {invoice.createdBy.type === 'admin' ? 'Admin' : 'Commercial'} · {invoice.createdBy.name}
              </span>
            )}
          </div>
          {invoice.description && (
            <p className="text-sm text-gray-500 mb-2">{invoice.description}</p>
          )}
          <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
            {invoice.recipientPhone && (
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {invoice.recipientPhone}</span>
            )}
            {invoice.recipientEmail && (
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {invoice.recipientEmail}</span>
            )}
            {invoice.dueDate && (
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Échéance {formatDate(invoice.dueDate)}</span>
            )}
          </div>
          {/* Link stays visible regardless of status — the person
              creating/managing invoices should always be able to find
              and re-send it, not just while it's still pending. */}
          {invoice.paymentUrl && (
            <div className="mt-2.5">
              <PaymentLinkChip url={invoice.paymentUrl} phone={invoice.recipientPhone} recipientName={invoice.recipientName} />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <span className="text-lg font-bold text-gray-900">{formatAmount(invoice.amount, invoice.currency)}</span>
          {invoice.status === 'pending' && (
            <div className="flex items-center gap-1.5">
              <button onClick={handleMarkPaidCash} disabled={markingPaid}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-lg hover:bg-green-100 border border-green-200 disabled:opacity-50">
                <Wallet className="h-3.5 w-3.5" /> {markingPaid ? '...' : 'Payée (cash)'}
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50">
                <Ban className="h-3.5 w-3.5" /> {cancelling ? '...' : 'Annuler'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Create Invoice Modal ─────────────────────────────────────────────────────

// Auto-computed due date — the aggregator's own invoice creation
// requires a dueDate (confirmed live: creation fails with "Date
// d'échéance requise" if omitted), but the user doesn't want to hand-
// pick one. 30 days out is a reasonable default that won't falsely
// trip isOverdue() within normal use, unlike today's date would.
const computeDefaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

const EMPTY_FORM = {
  recipientName: '', recipientPhone: '', recipientEmail: '',
  amount: '', currency: 'USD', description: '',
  dueDate: computeDefaultDueDate(),
};

const CreateInvoiceModal = ({ onClose, onCreated }) => {
  const [form, setForm]       = useState({ ...EMPTY_FORM });
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});
  const [created, setCreated] = useState(null); // holds the response once created — shows the payment link

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    const { isValid, errors: validationErrors } = invoiceService.validateInvoiceData(form);
    if (!isValid) { setErrors(validationErrors); return; }
    setErrors({});
    try {
      setSaving(true);
      const result = await invoiceService.createInvoice({
        recipientName:  form.recipientName.trim(),
        recipientPhone: form.recipientPhone.trim() || undefined,
        recipientEmail: form.recipientEmail.trim() || undefined,
        amount:         Number(form.amount),
        currency:       form.currency,
        dueDate:        form.dueDate,
        description:    form.description.trim() || undefined,
      });
      setCreated(result);
    } catch (e) {
      setErrors({ general: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Success view — show the payment link, don't just vanish it ──
  if (created) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Facture créée</h2>
            </div>
            <button onClick={() => { onCreated(); onClose(); }} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Envoyez ce lien à <span className="font-semibold text-gray-900">{form.recipientName}</span> pour qu'il/elle règle
              {' '}{formatAmount(Number(form.amount), form.currency)} directement sur la page de paiement Yogue Pay.
            </p>
            <PaymentLinkChip url={created.paymentUrl} phone={form.recipientPhone} recipientName={form.recipientName} />
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

  // ── Form view ──
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nouvelle facture</h2>
            <p className="text-sm text-gray-500 mt-0.5">Le client paiera via un lien Yogue Pay</p>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom du destinataire *</label>
            <input className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.recipientName ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="Jean Mukendi" value={form.recipientName} onChange={e => set('recipientName', e.target.value)} />
            {errors.recipientName && <p className="text-xs text-red-500 mt-1">{errors.recipientName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+243 812 345 678" value={form.recipientPhone} onChange={e => set('recipientPhone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.recipientEmail ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="jean@email.com" value={form.recipientEmail} onChange={e => set('recipientEmail', e.target.value)} />
              {errors.recipientEmail && <p className="text-xs text-red-500 mt-1">{errors.recipientEmail}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Montant *</label>
              <div className="flex gap-2">
                <select className="border border-gray-200 rounded-lg px-2 py-2.5 text-sm" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" className={`flex-1 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.amount ? 'border-red-300' : 'border-gray-200'}`}
                  placeholder="0" value={form.amount} onChange={e => set('amount', e.target.value)} />
              </div>
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Échéance</label>
              <input type="date" disabled value={form.dueDate}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Automatique — 30 jours après la création</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2} placeholder="Ex: Commission sur vente — appartement Gombe"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Annuler</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Création...' : 'Créer la facture'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const InvoicesPage = () => {
  const [invoices, setInvoices]     = useState([]);
  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const currentUser = apiHelpers.getCurrentUser();

  const fetchInvoices = useCallback(async (tab = activeTab) => {
    try {
      setLoading(true);
      const params = tab ? { status: tab } : {};
      const [invoicesRes, summaryRes] = await Promise.all([
        invoiceService.getInvoices(params),
        invoiceService.getInvoiceSummary().catch(() => null), // summary is a nice-to-have, don't block the list on it
      ]);
      let list = invoicesRes?.invoices || [];
      // Defensive client-side filter — the server is now asked to
      // filter by status too, but this guarantees the tabs are
      // correct regardless of whether that filter is fully honored
      // end to end (belt and suspenders, not a substitute for the
      // server fix).
      if (tab) list = list.filter((inv) => inv.status === tab);
      setInvoices(list);
      setSummary(summaryRes);
    } catch (e) {
      console.error('InvoicesPage:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchInvoices(''); }, []);

  const handleTabChange = (tab) => { setActiveTab(tab); fetchInvoices(tab); };

  const pendingCount   = invoices.filter(i => i.status === 'pending').length;
  const paidCount      = invoices.filter(i => i.status === 'paid').length;
  const overdueCount   = invoices.filter(isOverdue).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Chargement...' : `${invoices.length} facture${invoices.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Nouvelle facture
          </button>
          <button onClick={() => fetchInvoices(activeTab)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'En attente', value: pendingCount, icon: Clock,        color: 'amber' },
            { label: 'Payées',     value: paidCount,    icon: CheckCircle,  color: 'green' },
            { label: 'En retard',  value: overdueCount, icon: AlertCircle,  color: 'red'   },
            {
              label: 'Ce mois-ci',
              value: summary?.byCurrency?.USD?.invoicedThisMonth != null
                ? formatAmount(summary.byCurrency.USD.invoicedThisMonth, 'USD')
                : '—',
              icon: DollarSign, color: 'blue',
            },
          ].map(s => {
            const Icon = s.icon;
            const cls = {
              blue:  ['border-blue-200',  'bg-blue-50',  'text-blue-600'],
              red:   ['border-red-200',   'bg-red-50',   'text-red-600'],
              amber: ['border-amber-200', 'bg-amber-50', 'text-amber-600'],
              green: ['border-green-200', 'bg-green-50', 'text-green-600'],
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
        {STATUS_TABS.map(tab => (
          <button key={tab.value} onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === tab.value ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-gray-200">
          <FileText className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">Aucune facture trouvée</p>
          <p className="text-sm text-gray-400 mt-1">Créez une facture pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <InvoiceRow key={inv._id} invoice={inv} onRefresh={() => fetchInvoices(activeTab)} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => fetchInvoices(activeTab)}
        />
      )}
    </div>
  );
};

export default InvoicesPage;
