import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, MoreVertical } from 'lucide-react';
import { TableSkeleton } from './LoadingSpinner';

const Table = ({
  data = [],
  columns = [],
  loading = false,
  sortable = true,
  searchable = false,
  filterable = false,
  selectable = false,
  selectedRows = [],
  onSelectionChange = () => {},
  onRowClick = null,
  emptyMessage = 'Aucune donnée disponible',
  className = '',
  rowClassName = '',
  headerClassName = '',
  cellClassName = ''
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  // Tri des données
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Filtrage et recherche
  const filteredData = useMemo(() => {
    let result = sortedData;

    // Recherche textuelle
    if (searchable && searchTerm) {
      result = result.filter(row =>
        columns.some(column => {
          if (!column.searchable) return false;
          const value = row[column.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Filtres spécifiques
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        result = result.filter(row => {
          const rowValue = row[key];
          if (Array.isArray(value)) {
            return value.includes(rowValue);
          }
          return rowValue === value;
        });
      }
    });

    return result;
  }, [sortedData, searchTerm, filters, columns, searchable]);

  // Gestion du tri
  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Gestion de la sélection
  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange(filteredData.map(row => row.id || row._id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (rowId, checked) => {
    if (checked) {
      onSelectionChange([...selectedRows, rowId]);
    } else {
      onSelectionChange(selectedRows.filter(id => id !== rowId));
    }
  };

  const isAllSelected = selectedRows.length > 0 && selectedRows.length === filteredData.length;
  const isIndeterminate = selectedRows.length > 0 && selectedRows.length < filteredData.length;

  // Rendu d'une cellule
  const renderCell = (row, column) => {
    const value = row[column.key];

    if (column.render) {
      // ✅ FIXED: Pass additional context for selection columns
      const context = {
        selectedRows,
        onSelectionChange,
        handleSelectRow
      };
      return column.render(value, row, context);
    }

    if (column.type === 'badge') {
      const badgeConfig = column.badgeConfig || {};
      const badgeClass = badgeConfig[value] || 'bg-gray-100 text-gray-800';
      const formatValue = column.formatValue || ((val, row) => val);
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeClass}`}>
          {formatValue(value, row)}
        </span>
      );
    }

    if (column.type === 'currency') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(value || 0);
    }

    if (column.type === 'date') {
      return value ? new Date(value).toLocaleDateString('fr-FR') : '-';
    }

    if (column.type === 'datetime') {
      return value ? new Date(value).toLocaleString('fr-FR') : '-';
    }

    if (column.formatValue) {
      return column.formatValue(value, row);
    }

    return value || '-';
  };

  if (loading) {
    return <TableSkeleton rows={5} columns={columns.length} className={className} />;
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Barre d'outils */}
      {(searchable || filterable) && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            {searchable && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Filtres */}
            {filterable && (
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                {columns
                  .filter(col => col.filterable)
                  .map(column => (
                    <select
                      key={column.key}
                      value={filters[column.key] || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        [column.key]: e.target.value
                      }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{column.filterPlaceholder || `Tous les ${column.header}`}</option>
                      {column.filterOptions?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* En-tête */}
          <thead className={`bg-gray-50 ${headerClassName}`}>
            <tr>
              {/* Colonne de sélection */}
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}

              {/* Colonnes */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''}
                    ${column.headerClassName || ''}
                  `}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {sortable && column.sortable !== false && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={`h-3 w-3 ${
                            sortConfig.key === column.key && sortConfig.direction === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-300'
                          }`}
                        />
                        <ChevronDown
                          className={`h-3 w-3 -mt-1 ${
                            sortConfig.key === column.key && sortConfig.direction === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-300'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Corps du tableau */}
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-4xl">📭</div>
                    <p className="text-lg font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => {
                const rowId = row.id || row._id || index;
                const isSelected = selectedRows.includes(rowId);

                return (
                  <tr
                    key={rowId}
                    className={`
                      hover:bg-gray-50 transition-colors
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${isSelected ? 'bg-blue-50' : ''}
                      ${rowClassName}
                    `}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {/* Colonne de sélection */}
                    {selectable && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectRow(rowId, e.target.checked);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}

                    {/* Colonnes de données */}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`
                          px-6 py-4 whitespace-nowrap text-sm text-gray-900
                          ${column.cellClassName || cellClassName}
                        `}
                        style={column.width ? { width: column.width } : {}}
                      >
                        {renderCell(row, column)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Informations de pagination */}
      {filteredData.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {selectable && selectedRows.length > 0 && (
                <span className="mr-4">
                  {selectedRows.length} élément(s) sélectionné(s)
                </span>
              )}
              <span>
                Affichage de {filteredData.length} résultat(s)
                {data.length !== filteredData.length && ` sur ${data.length} total`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour les actions de ligne
export const TableActions = ({ actions = [], row }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 z-20 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(row);
                    setIsOpen(false);
                  }}
                  disabled={action.disabled}
                  className={`
                    w-full text-left px-4 py-2 text-sm transition-colors
                    ${action.disabled 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : action.danger
                        ? 'text-red-700 hover:bg-red-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    {action.icon && <action.icon className="h-4 w-4" />}
                    <span>{action.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ✅ FIXED: Enhanced createColumn with selection method
export const createColumn = {
  text: (key, header, options = {}) => ({
    key,
    header,
    type: 'text',
    ...options
  }),

  number: (key, header, options = {}) => ({
    key,
    header,
    type: 'number',
    ...options
  }),

  currency: (key, header, options = {}) => ({
    key,
    header,
    type: 'currency',
    ...options
  }),

  date: (key, header, options = {}) => ({
    key,
    header,
    type: 'date',
    ...options
  }),

  datetime: (key, header, options = {}) => ({
    key,
    header,
    type: 'datetime',
    ...options
  }),

  badge: (key, header, badgeConfig = {}, options = {}) => ({
    key,
    header,
    type: 'badge',
    badgeConfig,
    ...options
  }),

  custom: (key, header, renderFunction, options = {}) => ({
    key,
    header,
    render: renderFunction,
    ...options
  }),

  actions: (actions, options = {}) => ({
    key: 'actions',
    header: 'Actions',
    sortable: false,
    render: (_, row) => <TableActions actions={actions} row={row} />,
    ...options
  }),

  // ✅ FIXED: Simplified selection method
  selection: (options = {}) => ({
    key: '__selection__',
    header: '',
    sortable: false,
    width: '50px',
    render: (value, row, context) => {
      const rowId = row.id || row._id;
      const isSelected = context?.selectedRows?.includes(rowId) || false;
      
      return (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            if (context?.handleSelectRow) {
              context.handleSelectRow(rowId, e.target.checked);
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      );
    },
    ...options
  })
};

export default Table;
