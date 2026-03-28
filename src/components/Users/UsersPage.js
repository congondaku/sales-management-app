import React, { useState, useEffect } from 'react';
import {
  Search, UserPlus, Mail, Phone, Calendar,
  Edit, Trash2, Eye, X, ChevronLeft, ChevronRight,
  AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user.service';
import { SectionSpinner } from '../Commons/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import AdminEditUserModal from '../AdminEditUserModal';
import './UsersPage.css';

const LIMIT = 20;

const UsersPage = () => {
  const { user: authUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterImage, setFilterImage] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [salesPeople, setSalesPeople] = useState([]);

  // Server-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Plain async function — no useCallback so it always reads fresh params
  const loadUsers = async (page, search, imageFilter) => {
    try {
      setLoading(true);
      setError(null);

      const response = await userService.getUsers({
        page,
        limit: LIMIT,
        search: search || undefined,
        hasImage: imageFilter !== 'all' ? String(imageFilter === 'with') : undefined,
      });

      if (response.success) {
        setUsers(Array.isArray(response.users) ? response.users : []);
        setTotalPages(response.pagination?.pages ?? 1);
        setTotalItems(response.total ?? 0);
      } else {
        setError(response.message || 'Erreur lors du chargement des utilisateurs');
        setUsers([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError('Erreur de connexion au serveur');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    import('../../services/sales.service')
      .then(m => m.salesService.getSalesPeople({ limit: 200 }))
      .then(res => setSalesPeople(res.salesPeople || []))
      .catch(() => { }); // non-blocking
  }, []);

  // Single consolidated effect — debounces search, immediate on page/filter change
  useEffect(() => {
    const timer = setTimeout(
      () => loadUsers(currentPage, searchTerm, filterImage),
      searchTerm ? 400 : 0
    );
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, filterImage]);

  const handleViewUser = (u) => {
    setSelectedUser(u);
    setShowUserModal(true);
  };

  const handleEditUser = (u) => {
    setEditUserId(u._id);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      const response = await userService.deleteUser(userId);
      if (response.success) {
        loadUsers(currentPage, searchTerm, filterImage);
      } else {
        setError(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError("Erreur lors de la suppression de l'utilisateur");
    }
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * LIMIT + 1;
  const endItem = Math.min(currentPage * LIMIT, totalItems);

  return (
    <>
      <div className="up-root">
        {/* Header */}
        <div className="up-header">
          <div>
            <h2 className="up-title">Utilisateurs</h2>
            <p className="up-subtitle">Gérez les utilisateurs de la plateforme</p>
          </div>
          <button className="up-btn-primary">
            <UserPlus size={15} />
            Nouvel Utilisateur
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="up-error">
            <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="up-error-text">{error}</p>
              <button
                className="up-error-retry"
                onClick={() => loadUsers(currentPage, searchTerm, filterImage)}
              >
                <RefreshCw size={12} />
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="up-filters">
          <div className="up-search-wrap">
            <Search size={15} className="up-search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="up-search-input"
            />
          </div>

          <select
            value={filterImage}
            onChange={(e) => {
              setFilterImage(e.target.value);
              setCurrentPage(1);
            }}
            className="up-select"
          >
            <option value="all">Toutes les photos</option>
            <option value="with">Avec photo</option>
            <option value="without">Sans photo</option>
          </select>
        </div>

        {/* Table Card */}
        <div className="up-card">
          {loading ? (
            <div className="up-loading-overlay">
              <SectionSpinner text="Chargement…" />
            </div>
          ) : (
            <div className="up-table-wrap">
              <table className="up-table">
                <thead className="up-thead">
                  <tr>
                    <th className="up-th">Utilisateur</th>
                    <th className="up-th">Contact</th>
                    <th className="up-th">Commercial</th>
                    <th className="up-th">Inscription</th>
                    <th className="up-th">Statut</th>
                    <th className="up-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((u) => (
                      <tr key={u._id} className="up-tr">
                        {/* User */}
                        <td className="up-td">
                          <div className="up-user-cell">
                            <div className="up-avatar">
                              {u.profileImage ? (
                                <img
                                  src={u.profileImage}
                                  alt={`${u.firstName} ${u.lastName}`}
                                  className="up-avatar-img"
                                />
                              ) : (
                                <span className="up-avatar-initials">
                                  {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="up-user-name">{u.firstName} {u.lastName}</p>
                              <p className="up-user-id">{u._id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="up-td">
                          <div className="up-contact-item">
                            <Mail size={13} />
                            {u.email}
                          </div>
                          {u.phoneNumber && (
                            <div className="up-contact-item">
                              <Phone size={13} />
                              {u.phoneNumber}
                            </div>
                          )}
                        </td>

                        {/* Sales person */}
                        <td className="up-td">
                          {u.salesPerson ? (
                            <>
                              <p className="up-sales-name">{u.salesPerson.name}</p>
                              <p className="up-sales-territory">{u.salesPerson.territory}</p>
                            </>
                          ) : (
                            <span className="up-unassigned">Non assigné</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="up-td">
                          <div className="up-date">
                            <Calendar size={13} />
                            {formatDate(u.createdAt)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="up-td">
                          <span className={`up-badge ${u.accountStatus === 'active' ? 'up-badge-active' : 'up-badge-inactive'}`}>
                            {u.accountStatus === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="up-td">
                          <div className="up-actions">
                            <button
                              className="up-action-btn view"
                              onClick={() => handleViewUser(u)}
                              title="Voir"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              className="up-action-btn edit"
                              onClick={() => handleEditUser(u)}
                              title="Modifier"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              className="up-action-btn delete"
                              onClick={() => handleDeleteUser(u._id)}
                              title="Supprimer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">
                        <div className="up-empty">
                          {searchTerm || filterImage !== 'all'
                            ? 'Aucun utilisateur trouvé avec ces critères'
                            : 'Aucun utilisateur trouvé'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="up-pagination">
              <span className="up-pagination-info">
                {totalItems === 0
                  ? 'Aucun résultat'
                  : `${startItem}–${endItem} sur ${totalItems} utilisateurs`}
              </span>

              <div className="up-pagination-controls">
                <button
                  className="up-page-btn"
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={14} />
                  Précédent
                </button>

                <span className="up-page-label">
                  {currentPage} / {totalPages}
                </span>

                <button
                  className="up-page-btn"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="up-overlay" onClick={() => setShowUserModal(false)}>
          <div className="up-modal" onClick={(e) => e.stopPropagation()}>
            <div className="up-modal-header">
              <h3 className="up-modal-title">Détails de l'utilisateur</h3>
              <button className="up-modal-close" onClick={() => setShowUserModal(false)}>
                <X size={14} />
              </button>
            </div>

            <div className="up-modal-body">
              <div className="up-modal-avatar">
                {selectedUser.profileImage ? (
                  <img
                    src={selectedUser.profileImage}
                    alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                    className="up-avatar-img"
                  />
                ) : (
                  <span className="up-avatar-initials">
                    {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                  </span>
                )}
              </div>

              <div className="up-modal-grid">
                <div className="up-field">
                  <label>Prénom</label>
                  <p>{selectedUser.firstName}</p>
                </div>
                <div className="up-field">
                  <label>Nom</label>
                  <p>{selectedUser.lastName}</p>
                </div>
                <div className="up-field up-field-full">
                  <label>Email</label>
                  <p>{selectedUser.email}</p>
                </div>
                {selectedUser.phoneNumber && (
                  <div className="up-field up-field-full">
                    <label>Téléphone</label>
                    <p>{selectedUser.phoneNumber}</p>
                  </div>
                )}
                <div className="up-field">
                  <label>Inscription</label>
                  <p>{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div className="up-field">
                  <label>Statut</label>
                  <span className={`up-badge ${selectedUser.accountStatus === 'active' ? 'up-badge-active' : 'up-badge-inactive'}`}>
                    {selectedUser.accountStatus === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                {selectedUser.salesPerson && (
                  <div className="up-field up-field-full">
                    <label>Commercial</label>
                    <p>{selectedUser.salesPerson.name} — {selectedUser.salesPerson.territory}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editUserId && (
        <AdminEditUserModal
          userId={editUserId}
          salesPeopleList={salesPeople}
          onClose={() => {
            setShowEditModal(false);
            setEditUserId(null);
          }}
          onSaved={(updatedUser) => {
            // Refresh the row in the table without a full reload
            setUsers(prev =>
              prev.map(u => u._id === updatedUser._id ? { ...u, ...updatedUser } : u)
            );
          }}
        />
      )}
    </>
  );
};

export default UsersPage;
