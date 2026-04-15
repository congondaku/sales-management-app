import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DollarSign, TrendingUp, Activity, Wallet,
  RefreshCw, ArrowUpRight, ChevronLeft, ChevronRight,
  Home, Tag, Building2, CreditCard, BarChart2,
  Smartphone, X, Check, AlertCircle, Zap, Wifi, WifiOff,
} from 'lucide-react';
import apiClient from '../../services/api';

// ─── Formatters ───────────────────────────────────────────────────────────────

const n = (val, dec = 2) =>
  new Intl.NumberFormat('fr-CD', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(val || 0);
const usd = (val) => `$${n(val)}`;
const cdf = (val) => `${n(val, 0)} FC`;

// ─── Category config ──────────────────────────────────────────────────────────

const CAT_ICON = {
  booking_fee:            Home,
  listing_subscription:   Tag,
  hotel_subscription:     Building2,
  hotel_registration_fee: CreditCard,
  listing_activation:     Zap,
};

const CAT_BG = {
  booking_fee:            'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  listing_subscription:   'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  hotel_subscription:     'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  hotel_registration_fee: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  listing_activation:     'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
};

const CAT_TEXT = {
  booking_fee:            'text-blue-700 dark:text-blue-300',
  listing_subscription:   'text-emerald-700 dark:text-emerald-300',
  hotel_subscription:     'text-purple-700 dark:text-purple-300',
  hotel_registration_fee: 'text-amber-700 dark:text-amber-300',
  listing_activation:     'text-orange-700 dark:text-orange-300',
};

const OPERATORS = [
  { key: 'MPESA',  label: 'M-Pesa'  },
  { key: 'AIRTEL', label: 'Airtel'  },
  { key: 'ORANGE', label: 'Orange'  },
];

const METHOD_LABEL = {
  mpesa:          'M-Pesa',
  airtel:         'Airtel Money',
  orange:         'Orange Money',
  vodacom:        'M-Pesa',
  card:           'Carte',
  stripe:         'Stripe',
  admin_override: 'Admin',
};

const PERIODS = [
  { value: 'all',     label: 'Depuis le début' },
  { value: 'year',    label: 'Cette année'      },
  { value: 'quarter', label: 'Ce trimestre'     },
  { value: 'month',   label: 'Ce mois'          },
  { value: 'week',    label: 'Cette semaine'    },
];

const getAdminToken = () => localStorage.getItem('admin_token');

const getSocketURL = () => {
  try {
    const base = apiClient.defaults.baseURL || '';
    return base.replace('/api', '');
  } catch {
    return window.location.origin;
  }
};

// ─── Mini bar chart ───────────────────────────────────────────────────────────

const BarChart = ({ data }) => {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.totalUSD || 0), 1);
  return (
    <div className="flex items-end gap-[3px] h-20 w-full">
      {data.map((d, i) => {
        const pct    = ((d.totalUSD || 0) / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={i} className="flex-1 relative group">
            <div
              className={`w-full rounded-t-sm transition-all duration-300 ${isLast ? 'bg-emerald-500' : 'bg-emerald-200 dark:bg-emerald-800/60'}`}
              style={{ height: `${Math.max(pct, 3)}%` }}
            />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-10 pointer-events-none">
              {d.label}: {usd(d.totalUSD)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Withdraw modal ───────────────────────────────────────────────────────────

const WithdrawModal = ({ onClose, onSuccess, currentBalanceUSD }) => {
  const [form, setForm] = useState({
    amount: '', currency: 'USD', provider: 'MPESA',
    phoneNumber: '', motif: 'Retrait propriétaire',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.post('/finance/withdraw', { ...form, amount: Number(form.amount) });
      if (res.data.success) { setResult(res.data); onSuccess?.(); }
      else setError(res.data.message || 'Échec du retrait');
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit  = form.amount && Number(form.amount) > 0 && form.phoneNumber && !loading;
  const previewAmt = form.currency === 'USD' ? usd(form.amount || 0) : cdf(form.amount || 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-xl">
              <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Retirer des fonds</p>
              <p className="text-xs text-gray-400">Vers mon Mobile Money</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {currentBalanceUSD !== undefined && (
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Revenus accumulés (USD)</span>
              </div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{usd(currentBalanceUSD)}</span>
            </div>
          )}

          {result ? (
            <div className="text-center py-6">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="font-bold text-gray-900 dark:text-white text-xl mb-1">Retrait initié !</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                {result.currency === 'USD' ? usd(result.amount) : cdf(result.amount)} → {result.phone}
              </p>
              <p className="text-xs text-gray-400 font-mono">{result.txRef}</p>
              <button onClick={onClose} className="mt-5 bg-emerald-600 text-white px-8 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                Fermer
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Montant</label>
                  <input type="number" value={form.amount} onChange={set('amount')} min="1"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800 dark:text-white outline-none"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Devise</label>
                  <select value={form.currency} onChange={set('currency')}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800 dark:text-white outline-none">
                    <option value="USD">USD ($)</option>
                    <option value="CDF">CDF (FC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Opérateur</label>
                <div className="grid grid-cols-3 gap-2">
                  {OPERATORS.map(op => (
                    <button key={op.key} onClick={() => setForm(f => ({ ...f, provider: op.key }))}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        form.provider === op.key
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-emerald-400'
                      }`}>
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Mon numéro</label>
                <input type="tel" value={form.phoneNumber} onChange={set('phoneNumber')}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800 dark:text-white outline-none"
                  placeholder="+243 8X XXX XXXX" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Motif (optionnel)</label>
                <input value={form.motif} onChange={set('motif')}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800 dark:text-white outline-none"
                  placeholder="Motif du retrait" />
              </div>

              {form.amount > 0 && form.phoneNumber && (
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Vous allez recevoir</p>
                    <p className="font-bold text-gray-900 dark:text-white">{previewAmt}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-0.5">Via {OPERATORS.find(o => o.key === form.provider)?.label}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">{form.phoneNumber}</p>
                  </div>
                </div>
              )}

              <button onClick={submit} disabled={!canSubmit}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {loading
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> Envoi en cours…</>
                  : <><ArrowUpRight className="h-4 w-4" /> Retirer {previewAmt}</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const AnalyticsPage = () => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState('all');
  const [category, setCategory] = useState('');
  const [page, setPage]         = useState(1);
  const [error, setError]       = useState(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wsConnected, setWsConnected]   = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(null);

  const socketRef       = useRef(null);
  // Track whether the initial socket load has happened so we don't
  // double-fetch when both the socket connects AND the effect deps run
  const socketLoadedRef = useRef(false);
  const paramsRef       = useRef({ period, category, page });

  useEffect(() => { paramsRef.current = { period, category, page }; }, [period, category, page]);

  // ── HTTP fallback / manual refresh ────────────────────────
  const loadDataHTTP = useCallback(async (p = period, c = category, pg = page) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: pg, limit: 50 });
      if (p !== 'all') params.append('period', p);
      if (c) params.append('category', c);
      const res = await apiClient.get(`/finance/overview?${params}`);
      if (res.data.success) { setData(res.data); setLastUpdated(new Date()); }
      else setError(res.data.message || 'Erreur');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Emit socket request ───────────────────────────────────
  const socketRequest = useCallback((p, c, pg) => {
    if (socketRef.current?.connected) {
      setLoading(true);
      socketRef.current.emit('finance:request', { period: p, category: c, page: pg, limit: 50 });
      return true;
    }
    return false;
  }, []);

  // ── WebSocket setup — runs once on mount ──────────────────
  useEffect(() => {
    let socket = null;
    let didCleanup = false;

    const connect = async () => {
      try {
        const { io } = await import('socket.io-client');
        const token  = getAdminToken();
        if (!token) {
          // No admin token — just use HTTP
          loadDataHTTP(paramsRef.current.period, paramsRef.current.category, paramsRef.current.page);
          return;
        }

        socket = io(`${getSocketURL()}/finance`, {
          auth:                 { token },
          transports:           ['websocket'],
          reconnectionDelay:    2000,
          reconnectionAttempts: 10,
        });

        socket.on('connect', () => {
          if (didCleanup) return;
          setWsConnected(true);
          // Only do the initial load once — subsequent param changes
          // are handled by the period/category/page effect below
          if (!socketLoadedRef.current) {
            socketLoadedRef.current = true;
            setLoading(true);
            socket.emit('finance:request', {
              period:   paramsRef.current.period,
              category: paramsRef.current.category,
              page:     paramsRef.current.page,
              limit:    50,
            });
          }
        });

        socket.on('finance:update', (payload) => {
          if (didCleanup) return;
          setData(payload);
          setLastUpdated(new Date());
          setLoading(false);
          setError(null);
        });

        socket.on('finance:error', (err) => {
          if (didCleanup) return;
          setError(err.message);
          setLoading(false);
        });

        socket.on('disconnect', () => {
          if (didCleanup) return;
          setWsConnected(false);
        });

        socket.on('connect_error', () => {
          if (didCleanup) return;
          setWsConnected(false);
          // Socket failed entirely — fall back to HTTP (only if no data yet)
          if (!data) {
            loadDataHTTP(paramsRef.current.period, paramsRef.current.category, paramsRef.current.page);
          }
        });

        socketRef.current = socket;
      } catch {
        // socket.io-client not installed
        loadDataHTTP(paramsRef.current.period, paramsRef.current.category, paramsRef.current.page);
      }
    };

    connect();

    return () => {
      didCleanup = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── When period / category / page changes ─────────────────
  // Skip the very first render (socket handles initial load).
  // Only fires for user-driven changes after mount.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Try socket first, fall back to HTTP
    if (!socketRequest(period, category, page)) {
      loadDataHTTP(period, category, page);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, category, page]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [period, category]);

  const refresh = () => {
    if (!socketRequest(period, category, page)) {
      loadDataHTTP(period, category, page);
    }
  };

  const tx          = data?.transactions;
  const periodLabel = PERIODS.find(p => p.value === period)?.label || '';

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Finance & Revenus</h2>
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              wsConnected
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {wsConnected ? 'En direct' : 'Hors ligne'}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Historique complet des paiements · Congo Ndaku
            </p>
            {data?.bypassActive && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                ⚠️ Mode test — comptes exclus inclus
              </span>
            )}
            {!data?.bypassActive && data?.excludingTestAccounts && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                🔒 Comptes test exclus
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={period} onChange={e => setPeriod(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white outline-none"
          >
            {PERIODS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={refresh} disabled={loading}
            className="border border-gray-300 dark:border-gray-600 rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <RefreshCw className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowWithdraw(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2 shadow-sm transition-colors">
            <ArrowUpRight className="h-4 w-4" /> Retirer
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</p>
          <button onClick={refresh} className="text-sm text-red-600 dark:text-red-400 underline font-medium">Réessayer</button>
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Solde accumulé (USD)',
            value: loading ? null : usd(data?.allTime?.totalUSD),
            sub:   loading ? '' : `${(data?.allTime?.count || 0).toLocaleString('fr')} transactions au total`,
            icon:  Wallet,
            color: 'emerald',
            badge: 'Solde',
          },
          {
            label: 'Solde accumulé (CDF)',
            value: loading ? null : cdf(data?.allTime?.totalCDF),
            sub:   'Depuis le lancement',
            icon:  DollarSign,
            color: 'blue',
          },
          {
            label: period === 'all' ? 'Toutes périodes (USD)' : `${periodLabel} (USD)`,
            value: loading ? null : usd(data?.periodTotals?.totalUSD),
            sub:   loading ? '' : cdf(data?.periodTotals?.totalCDF),
            icon:  TrendingUp,
            color: 'purple',
          },
          {
            label: 'Transactions',
            value: loading ? null : (data?.periodTotals?.count || 0).toLocaleString('fr'),
            sub:   period === 'all' ? 'Depuis le début' : 'Sur la période',
            icon:  Activity,
            color: 'amber',
          },
        ].map((card, i) => {
          const Icon = card.icon;
          const colorMap = { emerald: 'bg-emerald-500', blue: 'bg-blue-500', purple: 'bg-purple-500', amber: 'bg-amber-500' };
          return (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`${colorMap[card.color]} p-2.5 rounded-xl`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                {card.badge && !loading && (
                  <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    {card.badge}
                  </span>
                )}
              </div>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded animate-pulse w-1/2" />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{card.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.sub}</p>
                </>
              )}
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-3">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Category + Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Revenus par catégorie</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{periodLabel}</span>
              {category && (
                <button onClick={() => setCategory('')} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                  × Effacer filtre
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(k => <div key={k} className="h-[72px] bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
          ) : !data?.byCategory?.length ? (
            <div className="text-center py-10">
              <BarChart2 className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucune transaction pour cette période</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.byCategory.map(cat => {
                const Icon   = CAT_ICON[cat.key] || BarChart2;
                const maxUSD = Math.max(...data.byCategory.map(c => c.totalUSD), 1);
                const pct    = ((cat.totalUSD / maxUSD) * 100).toFixed(0);
                const sel    = category === cat.key;
                return (
                  <button key={cat.key}
                    onClick={() => setCategory(prev => prev === cat.key ? '' : cat.key)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${CAT_BG[cat.key] || 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'} ${sel ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-gray-800' : 'hover:opacity-90'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 flex-shrink-0 ${CAT_TEXT[cat.key] || 'text-gray-500'}`} />
                        <div>
                          <p className={`text-sm font-semibold ${CAT_TEXT[cat.key] || 'text-gray-700 dark:text-gray-300'}`}>{cat.label}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{cat.count} transaction{cat.count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{usd(cat.totalUSD)}</p>
                        <p className="text-xs text-gray-400">{cdf(cat.totalCDF)}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 w-full bg-white/60 dark:bg-gray-600/40 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-current opacity-60 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex flex-col">
          <div className="mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">Tendance mensuelle</h3>
            <p className="text-xs text-gray-400 mt-0.5">12 derniers mois (USD)</p>
          </div>
          <div className="flex-1 flex flex-col justify-end mt-4">
            {loading ? <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" /> : <BarChart data={data?.monthlyTrend || []} />}
          </div>
          {!loading && data?.monthlyTrend?.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4">
              {data.monthlyTrend.slice(-4).reverse().map((m, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${i === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>{usd(m.totalUSD)}</span>
                    <span className="text-xs text-gray-400">{m.count} tx</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Transaction history ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-white">Historique des transactions</h3>
            {category && data?.byCategory && (() => {
              const cat = data.byCategory.find(c => c.key === category);
              return (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${CAT_BG[category] || ''} ${CAT_TEXT[category] || ''}`}>
                  {cat?.label || category}
                </span>
              );
            })()}
          </div>
          {tx && <span className="text-xs text-gray-400 dark:text-gray-500">{tx.total.toLocaleString('fr')} résultat{tx.total !== 1 ? 's' : ''}</span>}
        </div>

        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3,4,5].map(k => <div key={k} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
        ) : !tx?.data?.length ? (
          <div className="text-center py-16">
            <Activity className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/40">
                  {['Date', 'Client', 'Catégorie', 'Méthode', 'Montant'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {tx.data.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition-colors">

                    {/* Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm text-gray-800 dark:text-gray-200">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>

                    {/* Client — show hotel name as subtitle for reservations */}
                    <td className="px-5 py-3.5" style={{ maxWidth: 200 }}>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.customerName}</p>
                      {t.purpose === 'booking_fee' && t.hotelName ? (
                        <p className="text-xs text-blue-500 dark:text-blue-400 truncate font-medium">
                          🏨 {t.hotelName}{t.hotelVille ? ` · ${t.hotelVille}` : ''}
                        </p>
                      ) : t.externalId ? (
                        <p className="text-xs text-gray-400 font-mono truncate">{t.externalId}</p>
                      ) : null}
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${CAT_BG[t.purpose] || 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'} ${CAT_TEXT[t.purpose] || 'text-gray-600 dark:text-gray-400'}`}>
                        {t.purposeLabel}
                      </span>
                    </td>

                    {/* Method */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{METHOD_LABEL[t.paymentMethod] || t.paymentMethod || '—'}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{t.currency === 'USD' ? usd(t.amount) : cdf(t.amount)}</p>
                      <div className="flex items-center justify-end gap-0.5 mt-0.5">
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">Reçu</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tx && tx.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Page {tx.page} sur {tx.totalPages} · {tx.total.toLocaleString('fr')} transactions
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 min-w-[2rem] text-center">{page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= tx.totalPages}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showWithdraw && (
        <WithdrawModal
          onClose={() => setShowWithdraw(false)}
          onSuccess={refresh}
          currentBalanceUSD={data?.allTime?.totalUSD}
        />
      )}
    </div>
  );
};

export default AnalyticsPage;
