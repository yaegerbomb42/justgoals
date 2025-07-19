import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PlanDataContext = createContext();

function normalizePlanData(input) {
  let data = input;
  if (typeof input === 'string') {
    try { data = JSON.parse(input); } catch { return []; }
  }
  if (data && !Array.isArray(data) && typeof data === 'object') {
    data = [data];
  }
  function deepFlatten(arr) {
    return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(deepFlatten(val)) : acc.concat(val), []);
  }
  if (!Array.isArray(data)) return [];
  const flat = deepFlatten(data).filter(
    item => item && typeof item === 'object' && !Array.isArray(item) && typeof item.time === 'string' && typeof item.title === 'string'
  );
  return flat;
}

export const PlanDataProvider = ({ children }) => {
  const [plan, setPlan] = useState([]);
  const [planError, setPlanError] = useState('');

  // On mount, clean all daily_plan_* keys and load today's plan
  useEffect(() => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('daily_plan_')) {
        try {
          const plan = JSON.parse(localStorage.getItem(key));
          if (!Array.isArray(plan) || !plan.every(item => item && typeof item === 'object' && typeof item.time === 'string' && typeof item.title === 'string')) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    });
    // Load today's plan
    const today = new Date().toISOString().split('T')[0];
    const planKey = `daily_plan_global_${today}`;
    const savedPlan = localStorage.getItem(planKey);
    if (savedPlan) {
      setPlan(normalizePlanData(savedPlan));
    } else {
      setPlan([]);
    }
  }, []);

  // Save plan to localStorage
  const savePlan = useCallback((newPlan) => {
    const today = new Date().toISOString().split('T')[0];
    const planKey = `daily_plan_global_${today}`;
    const normalized = normalizePlanData(newPlan);
    if (normalized.length > 0) {
      localStorage.setItem(planKey, JSON.stringify(normalized));
      setPlan(normalized);
      setPlanError('');
    } else {
      localStorage.removeItem(planKey);
      setPlan([]);
      setPlanError('Plan data was invalid and has been reset.');
    }
  }, []);

  // Reset all plan data
  const resetAllPlans = useCallback(() => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('daily_plan_')) {
        localStorage.removeItem(key);
      }
    });
    setPlan([]);
    setPlanError('All plan data has been reset.');
    window.location.reload();
  }, []);

  return (
    <PlanDataContext.Provider value={{ plan, setPlan: savePlan, planError, resetAllPlans }}>
      {children}
    </PlanDataContext.Provider>
  );
};

export const usePlanData = () => {
  const context = useContext(PlanDataContext);
  if (!context) {
    throw new Error('usePlanData must be used within a PlanDataProvider');
  }
  return context;
}; 