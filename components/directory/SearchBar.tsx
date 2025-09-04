'use client';

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  recentSearches?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  debounceMs?: number;
  className?: string;
  showSuggestions?: boolean;
  maxSuggestions?: number;
}

const SearchBar = memo(({
  value,
  onChange,
  placeholder = "Search businesses...",
  suggestions = [],
  recentSearches = [],
  onSuggestionClick,
  debounceMs = 300,
  className = '',
  showSuggestions = true,
  maxSuggestions = 6
}: SearchBarProps) => {
  const [internalValue, setInternalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange(internalValue);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [internalValue, onChange, debounceMs]);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    setShowDropdown(showSuggestions && (newValue.length > 0 || recentSearches.length > 0));
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (showSuggestions && (internalValue.length > 0 || recentSearches.length > 0)) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding dropdown to allow clicking on suggestions
    setTimeout(() => setShowDropdown(false), 200);
  };

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange('');
    inputRef.current?.focus();
    setShowDropdown(recentSearches.length > 0);
  }, [onChange, recentSearches.length]);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setInternalValue(suggestion);
    onChange(suggestion);
    setShowDropdown(false);
    inputRef.current?.blur();
    onSuggestionClick?.(suggestion);
  }, [onChange, onSuggestionClick]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
    // Could add arrow key navigation for suggestions here
  };

  // Filter and combine suggestions
  const filteredSuggestions = suggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(internalValue.toLowerCase()) &&
      suggestion.toLowerCase() !== internalValue.toLowerCase()
    )
    .slice(0, maxSuggestions);

  const displayedRecentSearches = recentSearches
    .filter(search => 
      !internalValue || search.toLowerCase().includes(internalValue.toLowerCase())
    )
    .slice(0, maxSuggestions - filteredSuggestions.length);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="directory-search-container relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <Search className="w-5 h-5" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={internalValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="directory-search w-full pl-12 pr-12"
          style={{ fontSize: '16px' }} // Prevents zoom on iOS
          aria-label="Search businesses"
          autoComplete="off"
          spellCheck="false"
        />
        
        {internalValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Clear search"
            type="button"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && showDropdown && (filteredSuggestions.length > 0 || displayedRecentSearches.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Search suggestions"
        >
          {/* Recent Searches */}
          {displayedRecentSearches.length > 0 && (
            <div className="border-b border-gray-100 dark:border-gray-700">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Recent Searches
              </div>
              {displayedRecentSearches.map((search, index) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => handleSuggestionSelect(search)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                  role="option"
                  aria-selected="false"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {filteredSuggestions.length > 0 && (
            <div>
              {displayedRecentSearches.length > 0 && (
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Suggestions
                </div>
              )}
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                  role="option"
                  aria-selected="false"
                >
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
export type { SearchBarProps };