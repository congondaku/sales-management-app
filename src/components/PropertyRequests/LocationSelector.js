import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, X } from 'lucide-react';
import apiClient from '../../services/api';

/**
 * LocationSelector
 * Cascading province → ville → commune dropdowns
 * Matches the exact same API endpoints used in the mobile app's locationSlice
 *
 * Props:
 *   value:    { province, ville, commune, provinceId, villeId }
 *   onChange: (updatedValue) => void
 *   onRemove: () => void  — optional, shows remove button
 *   index:    number      — for "Localisation 1", "Localisation 2" etc.
 *   disabled: boolean
 */
const LocationSelector = ({ value = {}, onChange, onRemove, index = 0, disabled = false }) => {
  const [provinces, setProvinces]     = useState([]);
  const [villes, setVilles]           = useState([]);
  const [communes, setCommunes]       = useState([]);
  const [loadingP, setLoadingP]       = useState(false);
  const [loadingV, setLoadingV]       = useState(false);
  const [loadingC, setLoadingC]       = useState(false);

  // ── Fetch provinces on mount ────────────────────────────────────────────────
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoadingP(true);
        const res = await apiClient.get('/administrative-divisions/provinces');
        // Returns { success, data: [...provinces] } where each province has 'nom' field
        const data = res.data?.data || res.data?.provinces || res.data || [];
        const list = Array.isArray(data) ? data : [];
        console.log('📍 Provinces loaded:', list.length, list[0]);
        setProvinces(list);
      } catch (e) {
        console.error('Failed to load provinces:', e.message);
      } finally {
        setLoadingP(false);
      }
    };
    fetchProvinces();
  }, []);

  // ── Fetch villes when province changes ─────────────────────────────────────
  useEffect(() => {
    if (!value.provinceId) { setVilles([]); setCommunes([]); return; }
    const fetchVilles = async () => {
      try {
        setLoadingV(true);
        setVilles([]);
        setCommunes([]);
        const res = await apiClient.get(
          `/administrative-divisions/provinces/${value.provinceId}/villes?activeOnly=true`
        );
        // getVilles can return { data: [...] } or the province doc with villes embedded
        const raw = res.data?.data || res.data?.villes || res.data || [];
        const list = Array.isArray(raw) ? raw : (raw?.villes || []);
        setVilles(list);
      } catch (e) {
        console.error('Failed to load villes:', e.message);
      } finally {
        setLoadingV(false);
      }
    };
    fetchVilles();
  }, [value.provinceId]);

  // ── Fetch communes when ville changes ───────────────────────────────────────
  useEffect(() => {
    if (!value.provinceId || !value.villeId) { setCommunes([]); return; }
    const fetchCommunes = async () => {
      try {
        setLoadingC(true);
        setCommunes([]);
        const res = await apiClient.get(
          `/administrative-divisions/provinces/${value.provinceId}/villes/${value.villeId}/communes?activeOnly=true`
        );
        const raw = res.data?.data || res.data?.communes || res.data || [];
        const list = Array.isArray(raw) ? raw : (raw?.communes || []);
        setCommunes(list);
      } catch (e) {
        console.error('Failed to load communes:', e.message);
      } finally {
        setLoadingC(false);
      }
    };
    fetchCommunes();
  }, [value.provinceId, value.villeId]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleProvinceChange = (e) => {
    const selected = provinces.find(p => p._id === e.target.value);
    onChange({
      province:   selected?.nom || selected?.name || '',
      provinceId: selected?._id  || '',
      ville:      '',
      villeId:    '',
      commune:    '',
    });
  };

  const handleVilleChange = (e) => {
    const selected = villes.find(v => v._id === e.target.value);
    onChange({
      ...value,
      ville:   selected?.nom || selected?.name || '',
      villeId: selected?._id  || '',
      commune: '',
    });
  };

  const handleCommuneChange = (e) => {
    const selected = communes.find(c => c._id === e.target.value || c.nom === e.target.value || c.name === e.target.value);
    onChange({
      ...value,
      commune: selected?.nom || selected?.name || e.target.value,
    });
  };

  const selectClass = (hasValue, loading) => `
    w-full border rounded-xl px-3 py-2.5 text-sm appearance-none
    focus:outline-none focus:ring-2 focus:ring-blue-500
    transition-colors cursor-pointer
    ${loading ? 'opacity-60 cursor-wait' : ''}
    ${hasValue
      ? 'border-blue-400 bg-blue-50 text-blue-900 font-medium'
      : 'border-gray-200 bg-white text-gray-700'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
            {index + 1}
          </div>
          <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Localisation {index + 1}
          </span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            type="button"
            className="p-1 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-lg transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Province */}
      <div className="relative">
        <select
          value={value.provinceId || ''}
          onChange={handleProvinceChange}
          disabled={disabled || loadingP}
          className={selectClass(!!value.provinceId, loadingP)}
        >
          <option value="">{loadingP ? 'Chargement...' : 'Sélectionner une province'}</option>
          {provinces.map(p => (
            <option key={p._id} value={p._id}>{p.nom || p.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Ville */}
      <div className="relative">
        <select
          value={value.villeId || ''}
          onChange={handleVilleChange}
          disabled={disabled || !value.provinceId || loadingV}
          className={selectClass(!!value.villeId, loadingV)}
        >
          <option value="">
            {!value.provinceId ? 'Choisir une province d\'abord' : loadingV ? 'Chargement...' : 'Sélectionner une ville'}
          </option>
          {villes.map(v => (
            <option key={v._id} value={v._id}>{v.nom || v.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Commune */}
      <div className="relative">
        <select
          value={value.commune || ''}
          onChange={handleCommuneChange}
          disabled={disabled || !value.villeId || loadingC}
          className={selectClass(!!value.commune, loadingC)}
        >
          <option value="">
            {!value.villeId ? 'Choisir une ville d\'abord' : loadingC ? 'Chargement...' : 'Sélectionner une commune'}
          </option>
          {communes.map((c, i) => (
            <option key={c._id || i} value={c.nom || c.name}>{c.nom || c.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Summary chip when complete */}
      {value.province && value.ville && value.commune && (
        <div className="flex items-center gap-1.5 pt-1">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-xs text-green-700 font-medium">
            {value.commune}, {value.ville}, {value.province}
          </span>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
