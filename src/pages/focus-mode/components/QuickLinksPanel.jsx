import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../context/AuthContext';

const QuickLinksPanel = ({ 
  isOpen, 
  onToggle, 
  sessionId, 
  onLinkClick,
  sessionLinks = [],
  onSessionLinksChange,
  onGlobalLinksChange 
}) => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', icon: 'globe' });
  const [globalLinks, setGlobalLinks] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Load global links for this user
  useEffect(() => {
    if (user && user.id) {
      const savedGlobalLinks = localStorage.getItem(`focus_global_links_${user.id}`);
      if (savedGlobalLinks) {
        try {
          setGlobalLinks(JSON.parse(savedGlobalLinks));
        } catch (e) {
          console.error('Error parsing global links:', e);
        }
      }
    }
  }, [user]);

  // Save global links
  const saveGlobalLinks = (links) => {
    if (user && user.id) {
      localStorage.setItem(`focus_global_links_${user.id}`, JSON.stringify(links));
      onGlobalLinksChange?.(links);
    }
  };

  const handleAddLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;

    const linkData = {
      id: Date.now(),
      title: newLink.title.trim(),
      url: newLink.url.trim(),
      icon: newLink.icon,
      addedAt: new Date().toISOString()
    };

    // Always add to global links (permanent)
    const updatedGlobalLinks = [...globalLinks, linkData];
    setGlobalLinks(updatedGlobalLinks);
    saveGlobalLinks(updatedGlobalLinks);

    // Reset form
    setNewLink({ title: '', url: '', icon: 'globe' });
    setShowAddForm(false);
  };

  const handleRemoveLink = (linkId) => {
    const updatedGlobalLinks = globalLinks.filter(link => link.id !== linkId);
    setGlobalLinks(updatedGlobalLinks);
    saveGlobalLinks(updatedGlobalLinks);
  };

  const handleLinkClick = (link) => {
    // Open link in new tab
    window.open(link.url, '_blank', 'noopener,noreferrer');
    onLinkClick?.(link);
  };

  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const iconOptions = [
    { value: 'globe', label: 'Website' },
    { value: 'BookOpen', label: 'Documentation' },
    { value: 'Video', label: 'Video' },
    { value: 'FileText', label: 'Article' },
    { value: 'Code', label: 'Code' },
    { value: 'MessageSquare', label: 'Chat' },
    { value: 'Calendar', label: 'Calendar' },
    { value: 'Mail', label: 'Email' },
    { value: 'Github', label: 'GitHub' },
    { value: 'Youtube', label: 'YouTube' },
    { value: 'Twitter', label: 'Twitter' },
    { value: 'Linkedin', label: 'LinkedIn' }
  ];

  const allLinks = [...globalLinks];

  return (
    <div className={`fixed right-4 top-20 w-80 bg-surface border border-border rounded-lg shadow-lg transition-all duration-300 z-50 ${
      isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
    } ${isMinimized ? 'h-16 overflow-hidden' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="Link" size={20} />
          <h3 className="text-lg font-heading-semibold text-text-primary">Quick Links</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            iconName={isMinimized ? "ChevronDown" : "ChevronUp"}
            title={isMinimized ? "Expand" : "Minimize"}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            iconName="X"
          />
        </div>
      </div>
      {!isMinimized && (
        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Add Link Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            iconName="Plus"
            iconPosition="left"
            className="w-full mb-4"
          >
            Add Quick Link
          </Button>
          {/* Add Link Form */}
          {showAddForm && (
            <div className="bg-surface-800 rounded-lg p-4 mb-4 border border-border">
              <div className="space-y-3">
                                <div>
                  <label className="block text-sm font-body-medium text-text-primary mb-1">
                    Title
                  </label>
                  <Input
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    placeholder="Link title"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body-medium text-text-primary mb-1">
                    URL
                  </label>
                  <Input
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body-medium text-text-primary mb-1">
                    Icon
                  </label>
                  <select
                    value={newLink.icon}
                    onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {iconOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddLink}
                    className="flex-1"
                  >
                    Add Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
          {/* Links List */}
          <div className="space-y-2">
            {allLinks.length === 0 && (
              <div className="text-center text-xs text-text-secondary py-4">
                <Icon name="Link" size={24} className="mx-auto mb-2 opacity-50" />
                No quick links yet
              </div>
            )}
            {allLinks.map(link => (
              <div key={link.id} className="flex items-center bg-surface-700 border border-border rounded-lg p-2 group">
                <img
                  src={getFaviconUrl(link.url) || '/assets/favicon.ico'}
                  alt="favicon"
                  className="w-6 h-6 rounded mr-2"
                />
                <div className="flex-1 min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary font-body-medium truncate hover:underline"
                    title={link.title}
                  >
                    {link.title}
                  </a>
                  <div className="text-xs text-text-secondary truncate">{link.url}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLink(link.id)}
                  iconName="Trash2"
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Link"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickLinksPanel; 