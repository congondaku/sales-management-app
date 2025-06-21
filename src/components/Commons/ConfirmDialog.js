import React, { useState } from 'react';
import { AlertTriangle, Trash2, Check, X, Info, AlertCircle } from 'lucide-react';
import Modal from './Modal';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'warning',
  showInput = false,
  inputPlaceholder = '',
  inputValue = '',
  onInputChange = () => {},
  loading = false,
  confirmButtonColor = null,
  children = null
}) => {
  const [internalInputValue, setInternalInputValue] = useState(inputValue);

  // Configuration des types
  const typeConfig = {
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    danger: {
      icon: Trash2,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    success: {
      icon: Check,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      confirmButton: 'bg-green-600 hover:bg-green-700 text-white'
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
    }
  };

  const config = typeConfig[type] || typeConfig.warning;
  const Icon = config.icon;

  const handleConfirm = () => {
    if (showInput) {
      onConfirm(internalInputValue);
    } else {
      onConfirm();
    }
  };

  const handleInputChange = (value) => {
    setInternalInputValue(value);
    onInputChange(value);
  };

  const footer = (
    <>
      <button
        onClick={onClose}
        disabled={loading}
        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
      >
        {cancelText}
      </button>
      <button
        onClick={handleConfirm}
        disabled={loading}
        className={`px-6 py-2 rounded-lg font-medium disabled:opacity-50 ${
          confirmButtonColor || config.confirmButton
        }`}
      >
        {loading ? 'Traitement...' : confirmText}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="flex items-start space-x-4">
        {/* Icône */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>

        {/* Contenu */}
        <div className="flex-1 space-y-4">
          {/* Message */}
          <p className="text-gray-700 leading-relaxed">
            {message}
          </p>

          {/* Champ de saisie optionnel */}
          {showInput && (
            <div>
              <input
                type="text"
                placeholder={inputPlaceholder}
                value={internalInputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                autoFocus
              />
            </div>
          )}

          {/* Contenu personnalisé */}
          {children}
        </div>
      </div>
    </Modal>
  );
};

// Dialog de suppression spécialisé
export const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'élément',
  loading = false,
  additionalWarning = null
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      type="danger"
      title="Confirmer la suppression"
      message={`Êtes-vous sûr de vouloir supprimer ${itemType} "${itemName}" ? Cette action est irréversible.`}
      confirmText="Supprimer"
      cancelText="Annuler"
      loading={loading}
    >
      {additionalWarning && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Attention :</strong> {additionalWarning}
          </p>
        </div>
      )}
    </ConfirmDialog>
  );
};

// Dialog de déconnexion
export const LogoutConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      type="warning"
      title="Confirmer la déconnexion"
      message="Êtes-vous sûr de vouloir vous déconnecter ?"
      confirmText="Se déconnecter"
      cancelText="Annuler"
      loading={loading}
    />
  );
};

// Dialog de sauvegarde
export const SaveConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  hasUnsavedChanges = true,
  loading = false
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      type={hasUnsavedChanges ? 'warning' : 'info'}
      title={hasUnsavedChanges ? 'Modifications non sauvegardées' : 'Sauvegarder les modifications'}
      message={
        hasUnsavedChanges
          ? 'Vous avez des modifications non sauvegardées. Voulez-vous les sauvegarder avant de continuer ?'
          : 'Voulez-vous sauvegarder les modifications ?'
      }
      confirmText="Sauvegarder"
      cancelText={hasUnsavedChanges ? 'Ignorer les modifications' : 'Annuler'}
      loading={loading}
    />
  );
};

// Dialog avec champ de confirmation par saisie
export const TypeConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmationText,
  loading = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const isConfirmDisabled = inputValue !== confirmationText;

  const handleConfirm = () => {
    if (!isConfirmDisabled) {
      onConfirm();
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      type="danger"
      title={title}
      message={message}
      confirmText="Confirmer"
      cancelText="Annuler"
      loading={loading}
      showInput={true}
      inputPlaceholder={`Tapez "${confirmationText}" pour confirmer`}
      inputValue={inputValue}
      onInputChange={setInputValue}
      confirmButtonColor={`${isConfirmDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white`}
    >
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">
          Pour confirmer cette action dangereuse, veuillez taper{' '}
          <code className="bg-red-100 px-1 rounded font-mono">{confirmationText}</code>
        </p>
      </div>
    </ConfirmDialog>
  );
};

// Dialog de changement de statut
export const StatusChangeDialog = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus,
  itemName,
  loading = false,
  reasonRequired = false
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reasonRequired ? reason : undefined);
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      type="warning"
      title="Changer le statut"
      message={`Changer le statut de "${itemName}" de "${currentStatus}" vers "${newStatus}" ?`}
      confirmText="Changer le statut"
      cancelText="Annuler"
      loading={loading}
    >
      {reasonRequired && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Raison du changement (optionnel)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Expliquez pourquoi vous changez ce statut..."
            disabled={loading}
          />
        </div>
      )}
    </ConfirmDialog>
  );
};

// Dialog de traitement par lot
export const BatchActionDialog = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  selectedCount,
  loading = false
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      type="warning"
      title={`Action groupée : ${action}`}
      message={`Êtes-vous sûr de vouloir ${action.toLowerCase()} ${selectedCount} élément(s) sélectionné(s) ?`}
      confirmText={`${action} la sélection`}
      cancelText="Annuler"
      loading={loading}
    />
  );
};

// Hook pour gérer les dialogs de confirmation
export const useConfirmDialog = () => {
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const openDialog = (config) => {
    setDialog({
      isOpen: true,
      type: config.type || 'warning',
      title: config.title || 'Confirmation',
      message: config.message || '',
      onConfirm: config.onConfirm || (() => {}),
      onCancel: config.onCancel || (() => {}),
      ...config
    });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
    if (dialog.onCancel) {
      dialog.onCancel();
    }
  };

  const confirmDialog = () => {
    if (dialog.onConfirm) {
      dialog.onConfirm();
    }
    closeDialog();
  };

  // Méthodes de convenance
  const confirmDelete = (itemName, onConfirm, additionalWarning = null) => {
    openDialog({
      type: 'danger',
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`,
      onConfirm,
      additionalWarning
    });
  };

  const confirmAction = (action, onConfirm, message = null) => {
    openDialog({
      type: 'warning',
      title: `Confirmer ${action}`,
      message: message || `Êtes-vous sûr de vouloir ${action.toLowerCase()} ?`,
      onConfirm
    });
  };

  const confirmLogout = (onConfirm) => {
    openDialog({
      type: 'warning',
      title: 'Confirmer la déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      onConfirm
    });
  };

  return {
    dialog,
    openDialog,
    closeDialog,
    confirmDialog,
    confirmDelete,
    confirmAction,
    confirmLogout,
    // Composant à rendre
    ConfirmDialogComponent: () => (
      <ConfirmDialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        onConfirm={confirmDialog}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        {...dialog}
      />
    )
  };
};

export default ConfirmDialog;
