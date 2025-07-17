import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const JournalEntry = ({ entry, onEdit, onDelete, goals }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMoodColor = (mood) => {
    const moodColors = {
      'excellent': 'text-success',
      'good': 'text-primary',
      'okay': 'text-warning',
      'bad': 'text-error',
      'terrible': 'text-error'
    };
    return moodColors[mood] || 'text-text-secondary';
  };

  const getMoodEmoji = (mood) => {
    const moodEmojis = {
      'excellent': '🤩',
      'good': '😊',
      'okay': '😐',
      'bad': '😞',
      'terrible': '😢'
    };
    return moodEmojis[mood] || '😐';
  };

  const getGoalNames = (goalIds) => {
    if (!goalIds || goalIds.length === 0) return [];
    return goalIds.map(id => goals.find(goal => goal.id === id)?.title).filter(Boolean);
  };

  const truncateContent = (content, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (error) {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    try {
      return format(new Date(dateStr), 'h:mm a');
    } catch (error) {
      return '';
    }
  };

  const goalNames = getGoalNames(entry.goals);

  return (
    <motion.div
      layout
      className="bg-surface rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className={`text-2xl ${getMoodColor(entry.mood)}`}>
              {getMoodEmoji(entry.mood)}
            </span>
            <div>
              <h3 className="font-heading-medium text-text-primary">
                {entry.title || 'Untitled Entry'}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                <span>{formatDate(entry.date)}</span>
                {entry.createdAt && (
                  <>
                    <span>•</span>
                    <span>{formatTime(entry.createdAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(entry)}
            iconName="Edit"
            className="text-text-secondary hover:text-primary"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(entry.id)}
            iconName="Trash2"
            className="text-text-secondary hover:text-error"
          />
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-text-primary leading-relaxed">
          {isExpanded ? entry.content : truncateContent(entry.content)}
        </p>
        
        {entry.content.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary hover:text-primary-dark text-sm mt-2 transition-colors"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Goals */}
      {goalNames.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Target" size={16} className="text-text-secondary" />
            <span className="text-sm text-text-secondary">Related Goals</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {goalNames.map((goalName, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
              >
                {goalName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mood and Gratitude */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="Heart" size={16} className="text-error" />
            <span className="text-text-secondary">
              Mood: <span className={getMoodColor(entry.mood)}>{entry.mood}</span>
            </span>
          </div>
          
          {entry.gratitude && (
            <div className="flex items-center space-x-2">
              <Icon name="Sparkles" size={16} className="text-warning" />
              <span className="text-text-secondary">Grateful</span>
            </div>
          )}
        </div>

        {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
          <span className="text-text-secondary italic">
            Updated {formatTime(entry.updatedAt)}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default JournalEntry;