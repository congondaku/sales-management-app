import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, ChevronRight, Clock, CheckCircle,
  XCircle, AlertTriangle, Building2, User, Mail, Phone, Calendar,
} from 'lucide-react';
import apiClient from '../../services/api';

const STATUS_CONFIG = {
  pending:      { label: 'En attente',  bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  under_review: { label: 'En examen',   bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Search },
  approved:     { label: 'Approuvé',    bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle },
  rejected:     { label: 'Rejeté',      bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle },
  suspended:    { label: 'Suspendu',    bg: 'bg-amber-100',  text: 'text-amber-700',  icon: AlertTriangle },
};

const ALL_STATUSES = [
  { value: '',             label: 'Tous les statuts' },
  { value: 'pending',      label: 'En attente' },
  { value: 'under_review', label: 'En examen' },
  { value: 'approved',     label: 'Approuvé' },
  { value: 'rejected',     label: 'Rejeté' },
  { value: 'suspended',    label: 'Suspendu' },
];

const LEVEL_LABELS = {
  informal:    'Informel',
  semi_formal: 'Semi-formel',
  formal:      'Formel',
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

const PartnerQueue = ({ onSelectPartner }) => {
  const [partners, setPartners]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('pending');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [error, setError]           = useState('');

  const load = useCallback(async (p = 1, s = search, sf = statusFilter) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (sf) params.append('status', sf);
      if (s)  params.append('search', s);

      const res  = await apiClient.get(`/business-partner/admin/all?${params}`);
      const data = res.data;
      setPartners(data.partners || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
      setPage(p);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(1, search, statusFilter), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Partenaires</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Chargement...' : `${total} demande${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => load(page, search, statusFilter)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ALL_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-gray-200">
          <Building2 className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">Aucun partenaire trouvé</p>
          <p className="text-sm text-gray-400 mt-1">
            {search || statusFilter ? 'Modifiez vos filtres.' : 'Les demandes apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {partners.map(p => (
            <button
              key={p._id}
              onClick={() => onSelectPartner(p)}
              className="w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg font-bold">
                  {p.businessName?.[0] || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-bold text-gray-900 text-sm">{p.businessName}</p>
                  <StatusBadge status={p.status} />
                  {p.businessType?.nameFr && (
                    <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full font-medium">
                      {p.businessType.nameFr}
                    </span>
                  )}
                  {p.businessLevel && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {LEVEL_LABELS[p.businessLevel] || p.businessLevel}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {p.user?.firstName && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      {p.user.firstName} {p.user.lastName}
                    </span>
                  )}
                  {p.user?.email && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Mail className="h-3 w-3" />
                      {p.user.email}
                    </span>
                  )}
                  {p.businessPhone && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone className="h-3 w-3" />
                      {p.businessPhone}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {fmt(p.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="text-xs text-gray-500 text-right">{p.commune}<br />{p.ville}</p>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1, search, statusFilter)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => load(page + 1, search, statusFilter)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default PartnerQueue;
