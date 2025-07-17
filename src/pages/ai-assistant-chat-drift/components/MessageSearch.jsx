import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';

const MessageSearch = ({ messages, onSearchResults, isOpen, onToggle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      onSearchResults([]);
      return;
    }

    const results = messages.filter(message => 
      message.content.toLowerCase().includes(query.toLowerCase())
    ).map(message => ({
      ...message,
      highlightedContent: message.content.replace(
        new RegExp(query, 'gi'),
        `<mark class="bg-warning-200 text-warning-900 px-1 rounded">$&</mark>`
      )
    }));

    setSearchResults(results);
    onSearchResults(results);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    onSearchResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="bg-surface-800 border-b border-border p-4">
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <Input
            type="search"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
          <Icon 
            name="Search" 
            size={16} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted"
          />
        </div>
        
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors duration-fast"
          >
            <Icon name="X" size={16} />
          </button>
        )}
        
        <button
          onClick={onToggle}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors duration-fast"
        >
          <Icon name="ChevronUp" size={16} />
        </button>
      </div>

      {/* Search Results Summary */}
      {searchQuery && (
        <div className="mt-3 text-sm text-text-secondary">
          {searchResults.length > 0 ? (
            <span className="flex items-center space-x-1">
              <Icon name="Search" size={14} />
              <span>Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-text-muted">
              <Icon name="Search" size={14} />
              <span>No results found</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageSearch;