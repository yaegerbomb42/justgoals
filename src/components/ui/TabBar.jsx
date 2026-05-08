import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';

/**
 * TabBar
 *
 * Unified tab switcher used by Meals, Settings, Analytics, Achievements,
 * Progress, etc. Active tab uses the standard primary→secondary gradient.
 *
 *   <TabBar
 *     tabs={[{ id: 'plan', label: 'Weekly Plan', icon: 'Calendar' }, …]}
 *     activeTab={activeTab}
 *     onChange={setActiveTab}
 *   />
 */
const TabBar = ({
    tabs,
    activeTab,
    onChange,
    variant = 'pill', // 'pill' | 'underline' | 'segmented'
    size = 'md',
    fullWidth = false,
    className = '',
}) => {
    if (!Array.isArray(tabs) || tabs.length === 0) return null;

    const sizeCls =
        size === 'sm' ? 'text-xs px-3 py-1.5' : size === 'lg' ? 'text-base px-5 py-3' : 'text-sm px-4 py-2';

    if (variant === 'underline') {
        return (
            <div className={`border-b border-border flex gap-1 overflow-x-auto ${className}`} role="tablist">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onChange(tab.id)}
                            className={`relative ${sizeCls} font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
                                isActive
                                    ? 'text-primary'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            {tab.icon && <Icon name={tab.icon} className="w-4 h-4" />}
                            <span>{tab.label}</span>
                            {tab.count != null && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-surface-700/60 text-text-muted">
                                    {tab.count}
                                </span>
                            )}
                            {isActive && (
                                <motion.span
                                    layoutId="tabbar-underline"
                                    className="absolute left-0 right-0 -bottom-px h-0.5 bg-gradient-to-r from-primary to-secondary"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    // 'pill' (default) and 'segmented' share the rounded-pill container
    const containerCls =
        variant === 'segmented'
            ? 'inline-flex bg-surface-700/40 border border-border/40 rounded-lg p-1'
            : 'inline-flex bg-surface-700/30 border border-border/30 rounded-xl p-1';

    return (
        <div className={`${fullWidth ? 'flex' : 'inline-flex'} ${className}`} role="tablist">
            <div className={`${containerCls} ${fullWidth ? 'flex-1 flex' : ''} gap-1 overflow-x-auto`}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onChange(tab.id)}
                            className={`relative ${sizeCls} font-medium whitespace-nowrap flex items-center gap-2 rounded-lg transition-colors ${
                                fullWidth ? 'flex-1 justify-center' : ''
                            } ${
                                isActive
                                    ? 'text-white'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="tabbar-pill-active"
                                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary to-secondary shadow-md shadow-primary/20"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                {tab.icon && <Icon name={tab.icon} className="w-4 h-4" />}
                                <span>{tab.label}</span>
                                {tab.count != null && (
                                    <span
                                        className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                                            isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-surface-700/60 text-text-muted'
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TabBar;
