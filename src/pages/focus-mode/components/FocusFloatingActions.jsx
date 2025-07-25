import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FocusFloatingActions = ({ 
  onToggleLinks, 
  linksCount = 0,
  isLinksOpen
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Actions */}
      {isExpanded && (
        <div className="flex flex-col items-end space-y-3 mb-3">
          {/* Quick Links Button */}
          <div className="relative">
            <Button
              variant="primary"
              size="lg"
              onClick={onToggleLinks}
              iconName="Link"
              className={`transition-all duration-300 ${isLinksOpen ? 'bg-primary' : 'bg-surface-700 hover:bg-surface-600'}`}
            />
            {linksCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {linksCount}
              </span>
            )}
            <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-surface-800 text-text-primary text-xs px-2 py-1 rounded whitespace-nowrap">
              Quick Links
            </div>
          </div>
        </div>
      )}

      {/* Main Floating Action Button */}
      <div className="relative">
        <Button
          variant="primary"
          size="lg"
          onClick={toggleExpanded}
          iconName={isExpanded ? "X" : "Plus"}
          className="transition-all duration-300 shadow-lg hover:shadow-xl"
        />
        
        {/* Tooltip */}
        {!isExpanded && (
          <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-surface-800 text-text-primary text-xs px-2 py-1 rounded whitespace-nowrap">
            Quick Actions
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusFloatingActions; 