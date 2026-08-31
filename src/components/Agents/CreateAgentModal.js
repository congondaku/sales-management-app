import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import realEstateAgentService from '../../services/realEstateAgent.service';

const EMPTY_FORM = {
  firstName: '', lastName: '', phoneNumber: '', email: '', territory: '', notes: '',
};

const CreateAgentModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    if (!form.firstName.trim()) return setError('Le prénom est obligatoire.');
    if (!form.lastName.trim()) return setError('Le nom de famille est obligatoire.');
    if (!form.phoneNumber.trim()) return setError('Le numéro de téléphone est obligatoire.');

    setError('');
    try {
      setSaving(true);
      await realEstateAgentService.createAgent({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || undefined,
        territory: form.territory.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la création de l\'agent.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nouvel agent</h2>
            <p className="text-sm text-gray-500 mt-0.5">Ajoutez un agent au carnet d'adresses</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+243..."
              value={form.phoneNumber}
              onChange={e => set('phoneNumber', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Territoire</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Gombe, Kinshasa..."
              value={form.territory}
              onChange={e => set('territory', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          <p className="text-xs text-gray-400">
            Le statut KYC démarre à "En attente" par défaut. Ce n'est qu'un rappel visuel, l'agent
            peut recevoir des clients immédiatement.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {saving ? 'Création...' : 'Créer l\'agent'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAgentModal;
