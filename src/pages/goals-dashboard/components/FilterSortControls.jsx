import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FilterSortControls = ({ onFilterChange, onSortChange, activeFilter, activeSort }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const filterOptions = [
    { value: 'all', label: 'All Goals', icon: 'Target' },
    { value: 'active', label: 'Active', icon: 'Play' },
    { value: 'completed', label: 'Completed', icon: 'CheckCircle' },
    { value: 'overdue', label: 'Overdue', icon: 'AlertTriangle' },
    { value: 'high-priority', label: 'High Priority', icon: 'Flame' }
  ];

  const sortOptions = [
    { value: 'deadline', label: 'Deadline', icon: 'Calendar' },
    { value: 'priority', label: 'Priority', icon: 'ArrowUp' },
    { value: 'progress', label: 'Progress', icon: 'TrendingUp' },
    { value: 'created', label: 'Created Date', icon: 'Clock' },
    { value: 'alphabetical', label: 'A-Z', icon: 'Type' }
  ];

  const handleFilterSelect = (value) => {
    onFilterChange(value);
    setIsFilterOpen(false);
  };

  const handleSortSelect = (value) => {
    onSortChange(value);
    setIsSortOpen(false);
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        {/* Filter Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            iconName="Filter"
            iconPosition="left"
          >
            Filter
          </Button>
          
          {isFilterOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-elevation z-300">
              <div className="py-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect(option.value)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors duration-fast
                      ${activeFilter === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                      }
                    `}
                  >
                    <Icon 
                      name={option.icon} 
                      size={16} 
                      color={activeFilter === option.value ? '#FFFFFF' : 'currentColor'} 
                    />
                    <span className="text-sm font-body">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSortOpen(!isSortOpen)}
            iconName="ArrowUpDown"
            iconPosition="left"
          >
            Sort
          </Button>
          
          {isSortOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-elevation z-300">
              <div className="py-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortSelect(option.value)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors duration-fast
                      ${activeSort === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                      }
                    `}
                  >
                    <Icon 
                      name={option.icon} 
                      size={16} 
                      color={activeSort === option.value ? '#FFFFFF' : 'currentColor'} 
                    />
                    <span className="text-sm font-body">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          iconName="Grid3X3"
        >
        </Button>
        <Button
          variant="ghost"
          size="sm"
          iconName="List"
        >
        </Button>
      </div>
    </div>
  );
};

export default FilterSortControls;