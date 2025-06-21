import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange = () => {},
  onItemsPerPageChange = () => {},
  showItemsPerPage = true,
  showPageInfo = true,
  showFirstLast = true,
  maxVisiblePages = 5,
  itemsPerPageOptions = [5, 10, 20, 50, 100],
  className = ''
}) => {
  // Calculer les pages visibles
  const getVisiblePages = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajuster le début si nous sommes près de la fin
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    onItemsPerPageChange(newItemsPerPage);
    // Recalculer la page actuelle pour éviter de dépasser
    const newTotalPages = Math.ceil(totalItems / newItemsPerPage);
    if (currentPage > newTotalPages) {
      onPageChange(Math.max(1, newTotalPages));
    }
  };

  // Ne pas afficher la pagination s'il n'y a qu'une seule page
  if (totalPages <= 1) {
    return (
      <div className={`flex items-center justify-between p-4 ${className}`}>
        {showPageInfo && (
          <div className="text-sm text-gray-700">
            {totalItems === 0 ? (
              'Aucun résultat'
            ) : (
              `Affichage de ${totalItems} résultat${totalItems > 1 ? 's' : ''}`
            )}
          </div>
        )}
        {showItemsPerPage && totalItems > Math.min(...itemsPerPageOptions) && (
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Éléments par page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between p-4 space-y-3 sm:space-y-0 ${className}`}>
      {/* Informations sur les résultats */}
      {showPageInfo && (
        <div className="text-sm text-gray-700">
          Affichage de <span className="font-medium">{startItem}</span> à{' '}
          <span className="font-medium">{endItem}</span> sur{' '}
          <span className="font-medium">{totalItems}</span> résultats
        </div>
      )}

      {/* Contrôles de pagination */}
      <div className="flex items-center space-x-2">
        {/* Sélecteur d'éléments par page */}
        {showItemsPerPage && (
          <div className="flex items-center space-x-2 mr-4">
            <label className="text-sm text-gray-700">Par page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex items-center space-x-1">
          {/* Première page */}
          {showFirstLast && currentPage > 1 && (
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Première page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}

          {/* Page précédente */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Ellipsis au début */}
          {visiblePages[0] > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                1
              </button>
              {visiblePages[0] > 2 && (
                <span className="px-2 text-gray-500">...</span>
              )}
            </>
          )}

          {/* Pages visibles */}
          {visiblePages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`
                px-3 py-1 text-sm rounded transition-colors
                ${page === currentPage
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {page}
            </button>
          ))}

          {/* Ellipsis à la fin */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-2 text-gray-500">...</span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Page suivante */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dernière page */}
          {showFirstLast && currentPage < totalPages && (
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Dernière page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          )}
        </nav>
      </div>
    </div>
  );
};

// Composant de pagination simple (moins d'options)
export const SimplePagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center space-x-2 p-4 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Précédent
      </button>

      <span className="px-4 py-2 text-sm text-gray-700">
        Page {currentPage} sur {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Suivant
        <ChevronRight className="h-4 w-4 ml-1" />
      </button>
    </div>
  );
};

// Hook pour gérer la pagination
export const usePagination = (totalItems, initialItemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Réinitialiser à la page 1 si le nombre total d'éléments change
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalItems, totalPages, currentPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const changeItemsPerPage = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    // Recalculer la page actuelle
    const newTotalPages = Math.ceil(totalItems / newItemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Calculer les indices pour la slice
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    changeItemsPerPage,
    resetPagination,
    // Méthodes de convenance
    nextPage: () => goToPage(currentPage + 1),
    previousPage: () => goToPage(currentPage - 1),
    firstPage: () => goToPage(1),
    lastPage: () => goToPage(totalPages),
    // Informations utiles
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  };
};

export default Pagination;
