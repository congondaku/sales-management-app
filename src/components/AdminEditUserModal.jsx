import React, { useState, useEffect, useCallback } from 'react';
import {
  X, User, Shield, CreditCard, Clock,
  Loader2, Save, ChevronDown, AlertTriangle,
  CheckCircle, Ban, Zap, RotateCcw,
  Calendar, Hash
} from 'lucide-react';
import { userService } from '../services/user.service';
import apiClient from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtFull = (d) =>
  d ? new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';

// ─── Static maps ──────────────────────────────────────────────────────────────
const STATUS_META = {
  active:             { label: 'Actif',                color: '#16a34a', bg: '#dcfce7' },
  deactivated:        { label: 'Désactivé',             color: '#dc2626', bg: '#fee2e2' },
  pending_deletion:   { label: 'Suppression demandée',  color: '#d97706', bg: '#fef3c7' },
  confirmed_deletion: { label: 'Suppression confirmée', color: '#7c3aed', bg: '#ede9fe' },
};

const SUB_STATUS_META = {
  active:    { label: 'Actif',      color: '#16a34a', bg: '#dcfce7' },
  pending:   { label: 'En attente', color: '#d97706', bg: '#fef3c7' },
  expired:   { label: 'Expiré',     color: '#dc2626', bg: '#fee2e2' },
  cancelled: { label: 'Annulé',     color: '#6b7280', bg: '#f3f4f6' },
};

const PLAN_COLORS = {
  free:     { from: '#6b7280', to: '#9ca3af' },
  basic:    { from: '#0ea5e9', to: '#38bdf8' },
  standard: { from: '#8b5cf6', to: '#a78bfa' },
  premium:  { from: '#f59e0b', to: '#fbbf24' },
};

// ─── Micro-components ─────────────────────────────────────────────────────────
const Badge = ({ meta }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
    color: meta.color, background: meta.bg,
  }}>{meta.label}</span>
);

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.06em', color: '#9ca3af',
    }}>{label}</label>
    {children}
  </div>
);

const Inp = ({ value, onChange, placeholder, type = 'text', disabled }) => (
  <input
    type={type} value={value} onChange={onChange}
    placeholder={placeholder} disabled={disabled}
    style={{
      width: '100%', padding: '8px 12px', borderRadius: 8,
      border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827',
      background: disabled ? '#f9fafb' : '#fff', outline: 'none',
      boxSizing: 'border-box', cursor: disabled ? 'not-allowed' : 'text',
    }}
    onFocus={e => !disabled && (e.target.style.borderColor = '#6366f1')}
    onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
  />
);

const Sel = ({ value, onChange, children, disabled }) => (
  <div style={{ position: 'relative' }}>
    <select value={value} onChange={onChange} disabled={disabled} style={{
      width: '100%', padding: '8px 32px 8px 12px', borderRadius: 8,
      border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827',
      background: disabled ? '#f9fafb' : '#fff', appearance: 'none',
      outline: 'none', boxSizing: 'border-box', cursor: disabled ? 'not-allowed' : 'pointer',
    }}>{children}</select>
    <ChevronDown size={14} style={{
      position: 'absolute', right: 10, top: '50%',
      transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none',
    }} />
  </div>
);

const ActionBtn = ({ onClick, disabled, loading, icon: Icon, label, variant = 'default' }) => {
  const variants = {
    default: { bg: '#f3f4f6', color: '#374151' },
    danger:  { bg: '#fef2f2', color: '#dc2626' },
    success: { bg: '#f0fdf4', color: '#16a34a' },
    purple:  { bg: '#f5f3ff', color: '#7c3aed' },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '8px 14px', borderRadius: 9,
      border: `1.5px solid ${v.color}30`,
      background: v.bg, color: v.color,
      fontSize: 13, fontWeight: 600,
      cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
      opacity: (disabled || loading) ? 0.55 : 1,
      transition: 'all 0.15s',
    }}>
      {loading
        ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        : <Icon size={14} />}
      {label}
    </button>
  );
};

const TABS = [
  { id: 'profile',      label: 'Profil',      icon: User },
  { id: 'account',      label: 'Compte',       icon: Shield },
  { id: 'subscription', label: 'Abonnement',   icon: CreditCard },
  { id: 'activity',     label: 'Activité',     icon: Clock },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SubscriptionTab
// ─────────────────────────────────────────────────────────────────────────────
const SubscriptionTab = ({ userId }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [toast, setToast]     = useState(null);

  const [assignPlan,   setAssignPlan]   = useState('');
  const [assignCurr,   setAssignCurr]   = useState('USD');
  const [assignDays,   setAssignDays]   = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [assigning,    setAssigning]    = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [resettingId,  setResettingId]  = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await apiClient.get(`/admin/users/${userId}/subscription`);
      setData(res.data);
      const firstPaid = res.data.allPlans?.find(p => p.key !== 'free');
      if (firstPaid) setAssignPlan(firstPaid.key);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur chargement abonnement');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async () => {
    if (!assignPlan) return;
    try {
      setAssigning(true);
      const payload = {
        planKey: assignPlan, currency: assignCurr,
        reason: assignReason || 'Assigned by admin',
      };
      if (assignDays) payload.durationDays = parseInt(assignDays);
      await apiClient.post(`/admin/users/${userId}/subscription/assign`, payload);
      showToast('success', 'Plan activé avec succès !');
      setAssignReason(''); setAssignDays('');
      await load();
    } catch (err) {
      showToast('error', err.response?.data?.message || "Erreur lors de l'activation");
    } finally {
      setAssigning(false);
    }
  };

  const handleCancel = async (subId) => {
    if (!window.confirm('Annuler cet abonnement ?')) return;
    try {
      setCancellingId(subId);
      await apiClient.patch(`/admin/users/${userId}/subscription/${subId}/cancel`, { reason: 'Cancelled by admin' });
      showToast('success', 'Abonnement annulé');
      await load();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur annulation');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReset = async (subId) => {
    if (!window.confirm("Réinitialiser le compteur d'annonces à 0 ?")) return;
    try {
      setResettingId(subId);
      await apiClient.patch(`/admin/users/${userId}/subscription/${subId}/reset-usage`);
      showToast('success', 'Compteur réinitialisé');
      await load();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur reset');
    } finally {
      setResettingId(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 60, gap: 12, color: '#9ca3af' }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 14 }}>Chargement abonnement…</span>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
      <AlertTriangle size={16} color="#dc2626" style={{ marginTop: 1 }} />
      <div>
        <p style={{ margin: 0, fontSize: 13, color: '#dc2626' }}>{error}</p>
        <button onClick={load} style={{ marginTop: 6, fontSize: 12, color: '#dc2626',
          background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Réessayer
        </button>
      </div>
    </div>
  );

  const { activeSub, history = [], allPlans = [] } = data || {};
  const pc = activeSub ? (PLAN_COLORS[activeSub.plan] || PLAN_COLORS.basic) : null;
  const selectedPlanData = allPlans.find(p => p.key === assignPlan);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
          background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: 10,
        }}>
          {toast.type === 'success'
            ? <CheckCircle size={15} color="#16a34a" />
            : <AlertTriangle size={15} color="#dc2626" />}
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600,
            color: toast.type === 'success' ? '#16a34a' : '#dc2626' }}>{toast.msg}</p>
        </div>
      )}

      {/* ── Active subscription card ──────────────────────────────────────── */}
      {activeSub ? (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* Gradient header */}
          <div style={{
            background: `linear-gradient(135deg, ${pc.from}, ${pc.to})`,
            padding: '18px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.75)',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Plan actif</p>
              <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: '#fff' }}>
                {activeSub.planName}
              </p>
            </div>
            <Badge meta={SUB_STATUS_META[activeSub.status] || SUB_STATUS_META.active} />
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: '#fff',
            borderTop: '1px solid #f3f4f6' }}>
            {[
              { icon: Hash,     label: 'Annonces',  value: `${activeSub.listingsUsed} / ${activeSub.maxListings === 0 ? '∞' : activeSub.maxListings}` },
              { icon: Calendar, label: 'Début',     value: fmt(activeSub.startDate) },
              { icon: Calendar, label: 'Expire',    value: fmt(activeSub.endDate) },
            ].map(({ icon: Icon, label, value }, i) => (
              <div key={label} style={{
                padding: '14px 16px',
                borderRight: i < 2 ? '1px solid #f3f4f6' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <Icon size={12} color="#9ca3af" />
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Usage bar */}
          {activeSub.maxListings > 0 && (
            <div style={{ padding: '10px 16px', background: '#fafafa', borderTop: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Utilisation quota</span>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>
                  {Math.round((activeSub.listingsUsed / activeSub.maxListings) * 100)}%
                </span>
              </div>
              <div style={{ height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  width: `${Math.min(100, (activeSub.listingsUsed / activeSub.maxListings) * 100)}%`,
                  background: `linear-gradient(90deg, ${pc.from}, ${pc.to})`,
                }} />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ padding: '12px 16px', background: '#fafafa',
            borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ActionBtn
              onClick={() => handleReset(activeSub._id)}
              loading={resettingId === activeSub._id}
              disabled={activeSub.listingsUsed === 0}
              icon={RotateCcw} label="Réinitialiser compteur" variant="purple"
            />
            <ActionBtn
              onClick={() => handleCancel(activeSub._id)}
              loading={cancellingId === activeSub._id}
              disabled={activeSub.status === 'cancelled'}
              icon={Ban} label="Annuler abonnement" variant="danger"
            />
          </div>
        </div>
      ) : (
        <div style={{ padding: 32, textAlign: 'center', background: '#f9fafb',
          borderRadius: 14, border: '2px dashed #e5e7eb' }}>
          <CreditCard size={28} color="#d1d5db" style={{ marginBottom: 10 }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#374151' }}>Aucun abonnement actif</p>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#9ca3af' }}>
            Assignez un plan ci-dessous.
          </p>
        </div>
      )}

      {/* ── Assign / change plan ──────────────────────────────────────────── */}
      <div style={{ borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #f8faff, #fff)',
          borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={15} color="#6366f1" />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>
            {activeSub ? 'Changer de plan' : 'Assigner un plan'}
          </p>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {allPlans.filter(p => p.key !== 'free').map(p => {
              const pc2 = PLAN_COLORS[p.key] || PLAN_COLORS.basic;
              const selected = assignPlan === p.key;
              return (
                <button key={p.key} onClick={() => setAssignPlan(p.key)} style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  border: selected ? `2px solid ${pc2.from}` : '2px solid #e5e7eb',
                  background: selected ? `${pc2.from}12` : '#fff',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>{p.name}</p>
                    {selected && (
                      <div style={{ width: 18, height: 18, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${pc2.from}, ${pc2.to})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={11} color="#fff" />
                      </div>
                    )}
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6b7280' }}>
                    {p.maxListings === 0 ? 'Illimité' : `${p.maxListings} annonces`} · {p.durationDays}j
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: pc2.from }}>
                    ${p.priceUSD} USD
                  </p>
                </button>
              );
            })}
          </div>

          {/* Currency + custom duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Devise">
              <Sel value={assignCurr} onChange={e => setAssignCurr(e.target.value)}>
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
              </Sel>
            </Field>
            <Field label="Durée personnalisée (jours)">
              <Inp
                value={assignDays}
                onChange={e => setAssignDays(e.target.value)}
                placeholder={`Défaut: ${selectedPlanData?.durationDays || 30}j`}
                type="number"
              />
            </Field>
          </div>

          {/* Reason */}
          <Field label="Raison / note interne">
            <input
              value={assignReason}
              onChange={e => setAssignReason(e.target.value)}
              placeholder="Ex: compensation client, plan offert, correction erreur…"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#6366f1')}
              onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
            />
          </Field>

          {/* Price preview */}
          {assignPlan && selectedPlanData && (
            <div style={{ padding: '10px 14px', background: '#f5f3ff',
              borderRadius: 10, border: '1px solid #ddd6fe',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600 }}>
                {selectedPlanData.name} — {assignDays || selectedPlanData.durationDays}j
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#4c1d95' }}>
                  {assignCurr === 'USD'
                    ? `$${selectedPlanData.priceUSD} USD`
                    : `${selectedPlanData.priceCDF?.toLocaleString()} CDF`}
                </span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999,
                  background: '#ede9fe', color: '#7c3aed', fontWeight: 700, border: '1px solid #ddd6fe' }}>
                  admin_override
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleAssign}
            disabled={!assignPlan || assigning}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: (!assignPlan || assigning) ? '#c4b5fd' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: (!assignPlan || assigning) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {assigning
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Activation…</>
              : <><Zap size={14} />{activeSub ? 'Changer de plan' : 'Activer le plan'}</>}
          </button>
        </div>
      </div>

      {/* ── Subscription history ──────────────────────────────────────────── */}
      {history.length > 0 && (
        <div>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#374151' }}>
            Historique ({history.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map(sub => {
              const pc3 = PLAN_COLORS[sub.plan] || PLAN_COLORS.basic;
              const sm  = SUB_STATUS_META[sub.status] || SUB_STATUS_META.cancelled;
              const isAdmin = sub.payment?.paymentMethod === 'admin_override';
              return (
                <div key={sub._id} style={{
                  padding: '12px 16px', background: '#fff', borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                      background: `linear-gradient(135deg, ${pc3.from}, ${pc3.to})`,
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>
                          {sub.planName}
                        </p>
                        <Badge meta={sm} />
                        {isAdmin && (
                          <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999,
                            background: '#f5f3ff', color: '#7c3aed', fontWeight: 700,
                            border: '1px solid #ddd6fe' }}>admin</span>
                        )}
                      </div>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9ca3af' }}>
                        {fmt(sub.startDate)} → {fmt(sub.endDate)}
                        {' · '}
                        {sub.listingsUsed}/{sub.maxListings === 0 ? '∞' : sub.maxListings} annonces
                      </p>
                      {sub.payment?.metadata?.reason && (
                        <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6366f1', fontStyle: 'italic' }}>
                          "{sub.payment.metadata.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>
                      {sub.amount} {sub.currency}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                      {sub.payment?.paymentMethod || '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Main AdminEditUserModal
// ─────────────────────────────────────────────────────────────────────────────
const AdminEditUserModal = ({ userId, onClose, onSaved, salesPeopleList = [] }) => {
  const [tab, setTab]         = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);

  const [userData, setUserData]       = useState(null);
  const [commissions, setCommissions] = useState([]);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phoneNumber: '',
    accountStatus: 'active', salesPersonId: '',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await userService.getUserById(userId);
      if (!res.success) throw new Error(res.message || 'Erreur chargement');
      const u = res.user;
      setUserData(u);
      setCommissions(res.commissions || []);
      setForm({
        firstName:     u.firstName   || '',
        lastName:      u.lastName    || '',
        email:         u.email       || '',
        phoneNumber:   u.phoneNumber || '',
        accountStatus: u.accountStatus || 'active',
        salesPersonId: u.salesPersonId?._id || u.salesPersonId || '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const handleSave = async () => {
    try {
      setSaving(true); setError(null);
      const res = await userService.updateUser(userId, form);
      if (!res.success) throw new Error(res.message || 'Erreur sauvegarde');
      setSuccess(true);
      setUserData(res.user);
      setTimeout(() => setSuccess(false), 3000);
      if (onSaved) onSaved(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
  const showFooter = !loading && (tab === 'profile' || tab === 'account');

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 740, maxHeight: '90vh',
        background: '#fff', borderRadius: 16,
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #f3f4f6',
          background: 'linear-gradient(135deg, #f8faff, #fff)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: '#fff',
              }}>
                {userData?.profileImage
                  ? <img src={userData.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : `${form.firstName?.charAt(0) || '?'}${form.lastName?.charAt(0) || ''}`}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  {loading ? 'Chargement…' : `${form.firstName} ${form.lastName}`}
                </h2>
                {userData && (
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
                    @{userData.username || '—'} · {userData._id}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: '#f3f4f6',
              borderRadius: 8, padding: 8, cursor: 'pointer', color: '#6b7280',
              display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: '8px 8px 0 0',
                  border: 'none', cursor: 'pointer', fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  background: active ? '#fff' : 'transparent',
                  color: active ? '#6366f1' : '#6b7280',
                  borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
                }}>
                  <Icon size={14} />{t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: 60, gap: 12, color: '#9ca3af' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14 }}>Chargement…</span>
            </div>
          )}

          {!loading && error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 20 }}>
              <AlertTriangle size={16} color="#dc2626" style={{ marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 13, color: '#dc2626' }}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, marginBottom: 20 }}>
              <CheckCircle size={16} color="#16a34a" />
              <p style={{ margin: 0, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                Modifications enregistrées
              </p>
            </div>
          )}

          {/* PROFILE */}
          {!loading && tab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Field label="Prénom"><Inp value={form.firstName} onChange={set('firstName')} placeholder="Prénom" /></Field>
              <Field label="Nom"><Inp value={form.lastName} onChange={set('lastName')} placeholder="Nom" /></Field>
              <Field label="Email"><Inp value={form.email} onChange={set('email')} placeholder="email@example.com" type="email" /></Field>
              <Field label="Téléphone"><Inp value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="+243..." /></Field>
              <Field label="Nom d'utilisateur"><Inp value={userData?.username || ''} disabled /></Field>
              <Field label="Photo de profil">
                {userData?.profileImage
                  ? <a href={userData.profileImage} target="_blank" rel="noreferrer"
                      style={{ fontSize: 13, color: '#6366f1' }}>Voir l'image →</a>
                  : <span style={{ fontSize: 13, color: '#9ca3af' }}>Aucune photo</span>}
              </Field>
              <Field label="Inscrit le">
                <span style={{ fontSize: 14, color: '#374151' }}>{fmt(userData?.createdAt)}</span>
              </Field>
              <Field label="Dernière connexion">
                <span style={{ fontSize: 14, color: '#374151' }}>{fmt(userData?.lastLogin)}</span>
              </Field>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Commercial assigné">
                  <Sel value={form.salesPersonId} onChange={set('salesPersonId')}>
                    <option value="">— Non assigné —</option>
                    {salesPeopleList.map(sp => (
                      <option key={sp._id} value={sp._id}>
                        {sp.firstName} {sp.lastName} ({sp.salesId}) — {sp.territory}
                      </option>
                    ))}
                  </Sel>
                </Field>
              </div>
            </div>
          )}

          {/* ACCOUNT */}
          {!loading && tab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Field label="Statut du compte">
                <Sel value={form.accountStatus} onChange={set('accountStatus')}>
                  {Object.entries(STATUS_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </Sel>
              </Field>
              <div style={{ padding: 16, background: '#f9fafb', borderRadius: 12,
                border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#374151' }}>État actuel</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Statut</span>
                    <Badge meta={STATUS_META[userData?.accountStatus] || STATUS_META.active} />
                  </div>
                  {userData?.scheduledDeletionDate && (
                    <div>
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Suppression prévue</span>
                      <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 700 }}>{fmt(userData.scheduledDeletionDate)}</span>
                    </div>
                  )}
                </div>
                {userData?.deletionReason && (
                  <div>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em' }}>Raison</span>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#374151' }}>{userData.deletionReason}</p>
                  </div>
                )}
              </div>
              {userData?.passwordResetRequestedAt && (
                <div style={{ padding: 14, background: '#fffbeb', borderRadius: 10,
                  border: '1px solid #fde68a', display: 'flex', gap: 10 }}>
                  <AlertTriangle size={16} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                      Réinitialisation mot de passe en cours
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#92400e' }}>
                      Demandée le {fmt(userData.passwordResetRequestedAt)} · Expire {fmt(userData.passwordResetExpires)}
                    </p>
                  </div>
                </div>
              )}
              <Field label="Annonces sauvegardées">
                <span style={{ fontSize: 14, color: '#374151' }}>{userData?.saved?.length ?? 0} annonce(s)</span>
              </Field>
              <Field label="Inscrit via commercial">
                <span style={{ fontSize: 14, color: '#374151' }}>
                  {userData?.registeredBySales ? `Oui — ${userData.registeredBySales}` : 'Non'}
                </span>
              </Field>
            </div>
          )}

          {/* SUBSCRIPTION */}
          {!loading && tab === 'subscription' && <SubscriptionTab userId={userId} />}

          {/* ACTIVITY */}
          {!loading && tab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Compte créé',         date: userData?.createdAt,           icon: User,          color: '#6366f1' },
                  { label: 'Profil mis à jour',    date: userData?.updatedAt,           icon: Save,          color: '#0ea5e9' },
                  { label: 'Dernière connexion',   date: userData?.lastLogin,           icon: CheckCircle,   color: '#16a34a' },
                  { label: 'Mot de passe modifié', date: userData?.passwordChangedAt,   icon: Shield,        color: '#f59e0b' },
                  { label: 'Suppression demandée', date: userData?.deletionRequestedAt, icon: AlertTriangle, color: '#ef4444' },
                  { label: 'Suppression annulée',  date: userData?.deletionCancelledAt, icon: X,             color: '#8b5cf6' },
                ].filter(i => !!i.date)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((item, i, arr) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < arr.length - 1 ? 20 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8,
                            background: item.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={15} color={item.color} />
                          </div>
                          {i < arr.length - 1 && (
                            <div style={{ width: 1, flex: 1, background: '#e5e7eb', marginTop: 4 }} />
                          )}
                        </div>
                        <div style={{ paddingTop: 4 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.label}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>{fmtFull(item.date)}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {commissions.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#374151' }}>
                    Commissions ({commissions.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {commissions.slice(0, 8).map(c => (
                      <div key={c._id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', background: '#f9fafb', borderRadius: 10,
                        border: '1px solid #e5e7eb', fontSize: 13,
                      }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>
                            {c.salesPersonId ? `${c.salesPersonId.firstName} ${c.salesPersonId.lastName}` : '—'}
                          </p>
                          <p style={{ margin: 0, color: '#9ca3af', fontSize: 12 }}>
                            {fmt(c.createdAt)} · {c.salesPersonId?.salesId || ''}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontWeight: 700, color: '#111827' }}>
                            {c.commissionAmount != null ? `${c.commissionAmount} ${c.currency || ''}` : '—'}
                          </p>
                          <Badge meta={{
                            label: c.status,
                            color: c.status === 'paid' ? '#16a34a' : '#d97706',
                            bg:    c.status === 'paid' ? '#dcfce7' : '#fef3c7',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        {showFooter && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6',
            display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fafafa' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 9,
              border: '1.5px solid #e5e7eb', background: '#fff',
              fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '9px 20px', borderRadius: 9, border: 'none',
              background: saving ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              fontSize: 14, fontWeight: 700, color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {saving
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Enregistrement…</>
                : <><Save size={14} />Enregistrer</>}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

export default AdminEditUserModal;
