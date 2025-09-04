'use client';

import React, { memo, useEffect } from 'react';
import Link from 'next/link';
import { Star, MapPin, Phone, Globe, Award, ExternalLink, ChevronRight, TrendingUp } from 'lucide-react';
import './business-card.css';

interface Business {
  id: number;
  business_name: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  latitude?: number;
  longitude?: number;
}

interface BusinessCardProps {
  business: Business;
  rank?: number;
  className?: string;
  showRank?: boolean;
  collection?: string;
  city?: string;
  state?: string;
}

const BusinessCard = memo(({ business, rank, className = '', showRank = false, collection, city, state }: BusinessCardProps) => {
  // Debug logging
  useEffect(() => {
    console.log('BusinessCard Data:', {
      business,
      rank,
      showRank,
      collection,
      city,
      state
    });
  }, [business, rank, showRank, collection, city, state]);

  const formatPhone = (phone: string | undefined) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatAddress = (address: string | undefined) => {
    if (!address) return '';
    return address.replace(/,\s*,/g, ',').trim();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="business-card-star" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="business-card-star business-card-star-half" />
        );
      } else {
        stars.push(
          <Star key={i} className="business-card-star business-card-star-empty" />
        );
      }
    }
    return stars;
  };

  // Build the URL in the format: /state/city/niche/business-name
  const businessSlug = business.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const detailUrl = `/${state?.toLowerCase()}/${city?.toLowerCase().replace(/\s+/g, '-')}/${collection?.toLowerCase().replace(/\s+/g, '-')}/${businessSlug}`;

  return (
    <Link 
      href={detailUrl}
      className={`business-card-container ${className}`}>
      
      {/* Business Card Header */}
      <div className="business-card-header">
        <div className="business-card-info">
          <h3 className="business-card-name">
            {business.business_name}
          </h3>
          
          {/* Rating Section */}
          {business.rating ? (
            <div className="business-card-rating">
              <div className="business-card-stars">
                {renderStars(business.rating)}
              </div>
              <span className="business-card-rating-text">{business.rating.toFixed(1)}</span>
              {business.review_count && (
                <span className="business-card-review-count">({business.review_count.toLocaleString()} reviews)</span>
              )}
            </div>
          ) : (
            <div className="business-card-no-rating">No ratings yet</div>
          )}
        </div>
        
        {/* Rank Badge */}
        {showRank && rank && (
          <div className="business-card-rank">
            <div className="business-card-rank-badge">
              #{rank}
            </div>
            <span className="business-card-rank-label">Rank</span>
          </div>
        )}
      </div>

      {/* Top Rated Badge */}
      {business.rating && business.rating >= 4.5 && (
        <div className="business-card-badge">
          <Award className="business-card-badge-icon" />
          Top Rated
        </div>
      )}

      {/* Business Details */}
      <div className="business-card-details">
        {/* Address */}
        {business.address ? (
          <div className="business-card-address">
            <MapPin className="business-card-icon" />
            <span>{formatAddress(business.address)}</span>
          </div>
        ) : (
          <div className="business-card-address business-card-no-data">
            <MapPin className="business-card-icon" />
            <span>No address available</span>
          </div>
        )}

        {/* Phone */}
        {business.phone ? (
          <a 
            href={`tel:${business.phone}`} 
            className="business-card-phone"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Call ${business.business_name}`}
          >
            <Phone className="business-card-icon" />
            {formatPhone(business.phone)}
          </a>
        ) : (
          <div className="business-card-phone business-card-no-data">
            <Phone className="business-card-icon" />
            No phone available
          </div>
        )}

        {/* Website */}
        {business.website ? (
          <a 
            href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="business-card-website"
            onClick={(e) => e.stopPropagation()}
          >
            <Globe className="business-card-icon" />
            <span className="business-card-website-text">
              Visit Website
              <ExternalLink className="business-card-external-icon" />
            </span>
          </a>
        ) : (
          <div className="business-card-website business-card-no-data">
            <Globe className="business-card-icon" />
            No website available
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="business-card-actions">
        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            className="business-card-action-call"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Call ${business.business_name}`}
          >
            <Phone className="business-card-action-icon" />
            Call Now
          </a>
        )}
        
        {business.website && (
          <a
            href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="business-card-action-visit"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Visit ${business.business_name} website`}
          >
            <Globe className="business-card-action-icon" />
            Visit Site
          </a>
        )}
      </div>
      
      {/* View Profile Section */}
      <div className="business-card-footer">
        <span className="business-card-footer-text">
          <TrendingUp className="business-card-footer-icon" />
          View Full Profile
        </span>
        <ChevronRight className="business-card-footer-arrow" />
      </div>
    </Link>
  );
});

BusinessCard.displayName = 'BusinessCard';

export default BusinessCard;
export type { Business, BusinessCardProps };