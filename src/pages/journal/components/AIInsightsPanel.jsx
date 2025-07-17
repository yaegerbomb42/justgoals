import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AIInsightsPanel = ({ isOpen, onClose, insights, isLoading }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-surface rounded-lg border border-border max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Icon name="Brain" size={16} color="#FFFFFF" />
              </div>
              <h2 className="text-xl font-heading-semibold text-text-primary">
                AI Insights from Drift
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <Icon name="X" size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-text-secondary">
                  Analyzing your journal entries...
                </span>
              </div>
            ) : insights ? (
              <div className="space-y-4">
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center space-x-2 mb-3">
                    <Icon name="Sparkles" size={20} className="text-primary" />
                    <h3 className="font-heading-medium text-text-primary">
                      Personal Insights
                    </h3>
                  </div>
                  <div className="text-text-primary leading-relaxed whitespace-pre-wrap">
                    {insights}
                  </div>
                </div>

                <div className="bg-surface-700 rounded-lg p-4">
                  <h4 className="font-heading-medium text-text-primary mb-2">
                    How to use these insights:
                  </h4>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Use patterns to optimize your daily routine</li>
                    <li>• Address recurring challenges with specific strategies</li>
                    <li>• Build on emotional trends for better well-being</li>
                    <li>• Set goals based on your progress insights</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="AlertCircle" size={48} className="text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">
                  Unable to generate insights. Please try again later.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex justify-end">
            <Button
              variant="primary"
              onClick={onClose}
              iconName="CheckCircle"
              iconPosition="left"
            >
              Got it, thanks!
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIInsightsPanel;