import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import EnhancedTimelineProgressVisualization from './progress/components/EnhancedTimelineProgressVisualization';

// Demo data for showcasing the new progress features
const demoGoal = {
  id: 'demo-goal-1',
  title: 'Learn React Development',
  description: 'Master React and build modern web applications',
  category: 'education',
  deadline: '2024-06-01'
};

const demoAIJourney = [
  {
    id: 'ai_milestone_demo_1',
    title: 'Set Up Development Environment',
    description: 'Install Node.js, VS Code, and create your first React app',
    goalId: 'demo-goal-1',
    goalName: 'Learn React Development',
    priority: 'high',
    estimatedDays: 1,
    focusMinutes: 30,
    successCriteria: 'Successfully run "npm start" on a new React app',
    aiGenerated: true,
    type: 'milestone',
    completed: true,
    order: 0,
    adaptiveFeatures: {
      recommendedTimeOfDay: 'morning',
      breakdownSuggestion: 'Complete in a single 30-minute focused session',
      motivationalNote: 'You\'ll feel great satisfaction completing this milestone! ⭐'
    }
  },
  {
    id: 'ai_milestone_demo_2',
    title: 'Learn JSX and Components',
    description: 'Understand React syntax and create your first functional components',
    goalId: 'demo-goal-1',
    goalName: 'Learn React Development',
    priority: 'high',
    estimatedDays: 3,
    focusMinutes: 45,
    successCriteria: 'Create 3 different functional components with props',
    aiGenerated: true,
    type: 'milestone',
    completed: true,
    order: 1,
    adaptiveFeatures: {
      recommendedTimeOfDay: 'morning',
      breakdownSuggestion: 'Break this into 2 focused sessions of 45 minutes each',
      motivationalNote: 'Each step forward builds momentum toward your goal! 🚀'
    }
  },
  {
    id: 'ai_milestone_demo_3',
    title: 'Master State Management',
    description: 'Learn useState, useEffect, and component lifecycle',
    goalId: 'demo-goal-1',
    goalName: 'Learn React Development',
    priority: 'high',
    estimatedDays: 5,
    focusMinutes: 60,
    successCriteria: 'Build an interactive todo list with state',
    aiGenerated: true,
    type: 'milestone',
    completed: false,
    order: 2,
    adaptiveFeatures: {
      recommendedTimeOfDay: 'morning',
      breakdownSuggestion: 'Break this into 3 focused sessions of 60 minutes each',
      motivationalNote: 'You\'ve got this! Trust in your ability to achieve. 💪'
    }
  },
  {
    id: 'ai_milestone_demo_4',
    title: 'Practice with Forms and Events',
    description: 'Handle user input, form validation, and event handling',
    goalId: 'demo-goal-1',
    goalName: 'Learn React Development',
    priority: 'medium',
    estimatedDays: 3,
    focusMinutes: 45,
    successCriteria: 'Create a contact form with validation',
    aiGenerated: true,
    type: 'milestone',
    completed: false,
    order: 3,
    adaptiveFeatures: {
      recommendedTimeOfDay: 'afternoon',
      breakdownSuggestion: 'Complete in 2 focused sessions of 45 minutes each',
      motivationalNote: 'This brings you closer to the success you\'re working toward! 🎯'
    }
  },
  {
    id: 'ai_milestone_demo_5',
    title: 'Build Your First Project',
    description: 'Create a complete React application combining all learned concepts',
    goalId: 'demo-goal-1',
    goalName: 'Learn React Development',
    priority: 'high',
    estimatedDays: 7,
    focusMinutes: 90,
    successCriteria: 'Deploy a working React app to production',
    aiGenerated: true,
    type: 'milestone',
    completed: false,
    order: 4,
    adaptiveFeatures: {
      recommendedTimeOfDay: 'morning',
      breakdownSuggestion: 'Break this into 5 focused sessions of 90 minutes each',
      motivationalNote: 'You\'ll feel amazing once you complete your first project! 🌟'
    }
  },
  {
    id: 'ai_milestone_demo_6',
    title: 'Reflect and Plan Advanced Topics',
    description: 'Review your progress and plan next learning steps (Redux, TypeScript, etc.)',
    goalId: 'demo-goal-1',
    goalName: 'Learn React Development',
    priority: 'medium',
    estimatedDays: 1,
    focusMinutes: 30,
    successCriteria: 'Document learnings and create roadmap for advanced topics',
    aiGenerated: true,
    type: 'reflection',
    completed: false,
    order: 5,
    adaptiveFeatures: {
      recommendedTimeOfDay: 'flexible',
      breakdownSuggestion: 'Complete in a single 30-minute reflection session',
      motivationalNote: 'Reflection helps solidify your learning and plan your next steps! 📚'
    }
  }
];

const ProgressDemo = () => {
  const [journey, setJourney] = useState(demoAIJourney);

  const handleUpdateProgress = (milestoneId, updates) => {
    setJourney(prevJourney => 
      prevJourney.map(milestone => 
        milestone.id === milestoneId ? { ...milestone, ...updates } : milestone
      )
    );
  };

  const handleCreateAIJourney = (newJourney) => {
    setJourney(newJourney);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Demo Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-3xl font-heading-bold text-text-primary mb-2">
                AI-Powered Progress Journey
              </h1>
              <p className="text-text-secondary text-lg">
                Experience the new intelligent progress tracking system
              </p>
              <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full">
                <Icon name="Bot" size={16} className="text-primary" />
                <span className="text-sm font-medium text-text-primary">AI-Generated Demo</span>
              </div>
            </motion.div>
          </div>

          {/* Features Showcase */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface p-6 rounded-lg border border-border"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center mb-4">
                <Icon name="Bot" size={24} className="text-primary" />
              </div>
              <h3 className="font-heading-medium text-text-primary mb-2">AI-Generated Milestones</h3>
              <p className="text-text-secondary text-sm">
                Automatically creates personalized progress steps based on your patterns and goal
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface p-6 rounded-lg border border-border"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-lg flex items-center justify-center mb-4">
                <Icon name="TrendingUp" size={24} className="text-accent" />
              </div>
              <h3 className="font-heading-medium text-text-primary mb-2">Smart Progress Insights</h3>
              <p className="text-text-secondary text-sm">
                Real-time analysis of your progress velocity with adaptive recommendations
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface p-6 rounded-lg border border-border"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-warning/20 to-error/20 rounded-lg flex items-center justify-center mb-4">
                <Icon name="Target" size={24} className="text-warning" />
              </div>
              <h3 className="font-heading-medium text-text-primary mb-2">Contextual Guidance</h3>
              <p className="text-text-secondary text-sm">
                Personalized timing, focus duration, and motivational notes for each milestone
              </p>
            </motion.div>
          </div>

          {/* Enhanced Progress Visualization Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <EnhancedTimelineProgressVisualization
              selectedGoal={demoGoal}
              progressMarks={journey}
              onUpdateProgress={handleUpdateProgress}
              onCreateAIJourney={handleCreateAIJourney}
            />
          </motion.div>

          {/* Demo Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center space-x-4 px-6 py-3 bg-surface rounded-lg border border-border">
              <Icon name="Mouse" size={16} className="text-text-secondary" />
              <span className="text-sm text-text-secondary">
                Click the milestone circles to toggle completion status
              </span>
            </div>
          </motion.div>

          {/* Implementation Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20"
          >
            <h3 className="font-heading-medium text-text-primary mb-3 flex items-center">
              <Icon name="Info" size={20} className="text-primary mr-2" />
              How It Works
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-text-secondary">
              <div>
                <h4 className="font-medium text-text-primary mb-2">Data Sources</h4>
                <ul className="space-y-1">
                  <li>• Journal entries and mood patterns</li>
                  <li>• Focus session data and notes</li>
                  <li>• Achievement history and preferences</li>
                  <li>• Progress meter updates and timing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">AI Features</h4>
                <ul className="space-y-1">
                  <li>• Adaptive milestone generation</li>
                  <li>• Personalized timing recommendations</li>
                  <li>• Progress velocity analysis</li>
                  <li>• Contextual motivational guidance</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProgressDemo;