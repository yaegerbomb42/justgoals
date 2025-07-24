import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DateHeader = ({ selectedDate, onDateChange, onViewModeChange, viewMode }) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const viewModes = [
    { key: 'day', label: 'Day', icon: 'Calendar' },
    { key: 'week', label: 'Week', icon: 'CalendarDays' },
    { key: 'month', label: 'Month', icon: 'CalendarRange' }
  ];

  return (
    <div className="bg-surface border-b border-border p-4">
      <div className="flex items-center justify-between">
        {/* Date Navigation */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate(-1)}
            iconName="ChevronLeft"
            className="text-text-secondary hover:text-text-primary"
          />
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-surface-700 transition-colors duration-fast"
            >
              <Icon name="Calendar" size={16} className="text-primary" />
              <span className="font-heading-medium text-text-primary">
                {formatDate(selectedDate)}
              </span>
              <Icon name="ChevronDown" size={14} className="text-text-secondary" />
            </button>
            
            {selectedDate.toDateString() !== new Date().toDateString() && (
              <Button
                variant="ghost"
                size="xs"
                onClick={goToToday}
                className="text-text-secondary hover:text-primary"
              >
                Today
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate(1)}
            iconName="ChevronRight"
            className="text-text-secondary hover:text-text-primary"
          />
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center space-x-1 bg-surface-800 rounded-lg p-1">
          {viewModes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => onViewModeChange(mode.key)}
              className={`
                flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-caption transition-all duration-fast
                ${viewMode === mode.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                }
              `}
            >
              <Icon name={mode.icon} size={12} />
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date Picker Dropdown */}
      {isDatePickerOpen && (
        <div className="absolute top-full left-0 right-0 bg-surface border border-border rounded-lg mt-2 p-4 shadow-elevation z-100">
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Calendar implementation would go here */}
            <div className="col-span-7 text-sm text-text-secondary p-4">
              Calendar picker implementation
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateHeader;