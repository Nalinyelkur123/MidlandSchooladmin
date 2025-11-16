import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHandler, setSearchHandler] = useState(null);

  // Clear search when route changes
  useEffect(() => {
    setSearchQuery('');
  }, [location.pathname]);

  const registerSearchHandler = (handler) => {
    setSearchHandler(() => handler);
  };

  const unregisterSearchHandler = () => {
    setSearchHandler(null);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (searchHandler) {
      searchHandler(value);
    }
  };

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery: handleSearchChange,
        registerSearchHandler,
        unregisterSearchHandler,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
}

