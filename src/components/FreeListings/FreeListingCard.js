import React from 'react';
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  Home,
  PlayCircle
} from 'lucide-react';

const FreeListingCard = ({ 
  listing, 
  onEdit, 
  onActivate, 
  onDelete, 
  isAdmin, 
  isSalesPerson 
}) => {
  // Get status badge
  const getStatusBadge = () => {
    if (listing.activeSubscription && listing.paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </span>
      );
    } else if (listing.status === 'pending_payment' || listing.paymentStatus === 'unpaid') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="h-3 w-3 mr-1" />
          Inactif
        </span>
      );
    }
  };

  // Get property type label
  const getPropertyTypeLabel = (type) => {
    const labels = {
      apartment: 'Appartement',
      house: 'Maison',
      studio: 'Studio',
      villa: 'Villa',
      office: 'Bureau',
      land: 'Terrain',
      shop: 'Magasin',
      condo: 'Condo',
      warehouse: 'Entrepôt',
      plot: 'Parcelle',
      hotel: 'Hôtel',
      compound: 'Complexe'
    };
    return labels[type] || type;
  };

  // Get listing type label
  const getListingTypeLabel = (type) => {
    const labels = {
      rent: 'À louer',
      sale: 'À vendre',
      daily: 'Location journalière'
    };
    return labels[type] || type;
  };

  // Format price
  const formatPrice = () => {
    const price = listing.priceMonthly || listing.priceDaily || listing.priceSale;
    return `${price} ${listing.currency}`;
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!listing.expiryDate) return null;
    
    const now = new Date();
    const expiry = new Date(listing.expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  // Check if listing is free
  const isFree = listing.subscriptionPlan === 'free_listing';

  // Check if user can edit/delete
  const canModify = isAdmin || isSalesPerson;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title || 'Listing'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <Home className="h-16 w-16 text-gray-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {getStatusBadge()}
        </div>

        {/* Free Badge */}
        {isFree && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Gratuit
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {listing.title || 'Annonce sans titre'}
        </h3>

        {/* Property Info */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{getPropertyTypeLabel(listing.typeOfListing)}</span>
          <span className="text-gray-400">•</span>
          <span>{getListingTypeLabel(listing.listingType)}</span>
        </div>

        {/* Location */}
        <div className="flex items-start space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
          <span className="line-clamp-2">
            {listing.address}, {listing.commune}, {listing.ville}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <span className="text-xl font-bold text-green-600">
            {formatPrice()}
          </span>
          {listing.negotiable && (
            <span className="text-xs text-gray-500">(négociable)</span>
          )}
        </div>

        {/* Details */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {listing.details?.bedroom > 0 && (
            <span>🛏️ {listing.details.bedroom}</span>
          )}
          {listing.details?.bathroom > 0 && (
            <span>🚿 {listing.details.bathroom}</span>
          )}
          {listing.details?.area > 0 && (
            <span>📐 {listing.details.area}m²</span>
          )}
        </div>

        {/* Expiry Info */}
        {listing.activeSubscription && daysUntilExpiry !== null && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className={`${
              daysUntilExpiry < 7 
                ? 'text-red-600 font-medium' 
                : daysUntilExpiry < 30 
                ? 'text-orange-600' 
                : 'text-gray-600'
            }`}>
              {daysUntilExpiry > 0 
                ? `Expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}` 
                : 'Expiré'}
            </span>
          </div>
        )}

        {/* Contact Info */}
        <div className="pt-3 border-t border-gray-200 space-y-1 text-xs text-gray-600">
          <p>👤 {listing.listerFirstName} {listing.listerLastName}</p>
          <p>📧 {listing.listerEmailAddress}</p>
          <p>📱 {listing.listerPhoneNumber}</p>
        </div>
      </div>

      {/* Actions */}
      {canModify && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Edit Button */}
            <button
              onClick={() => onEdit(listing)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit className="h-4 w-4" />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => onDelete(listing._id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Activate Button (if not active) */}
          {!listing.activeSubscription && (
            <button
              onClick={() => onActivate(listing)}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <PlayCircle className="h-4 w-4 mr-1" />
              Activer
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FreeListingCard;
