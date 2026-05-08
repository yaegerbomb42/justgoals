import React from 'react';
import Icon from '../AppIcon';
import Card from './Card';

/**
 * StatCard
 *
 * Small metric card used on dashboards (Goals, Meals, Journal, Progress,
 * Analytics, Achievements). Replaces the various ad-hoc
 * `bg-surface border border-border rounded-lg p-4` snippets so every
 * dashboard's "Total / Completed / Streak / …" row matches.
 */
const toneMap = {
    default: 'text-text-primary',
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-blue-500',
};

const iconBgMap = {
    default: 'bg-surface-700/40 text-text-secondary',
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-blue-500/10 text-blue-500',
};

const StatCard = ({
    icon,
    label,
    value,
    sublabel,
    tone = 'default',
    trend,
    className = '',
}) => {
    const valueCls = toneMap[tone] || toneMap.default;
    const iconCls = iconBgMap[tone] || iconBgMap.default;

    return (
        <Card padding="md" className={`flex items-start gap-3 ${className}`}>
            {icon && (
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${iconCls}`}>
                    <Icon name={icon} className="w-5 h-5" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm text-text-secondary truncate">{label}</div>
                <div className={`text-2xl font-heading-bold mt-0.5 ${valueCls}`}>
                    {value}
                </div>
                {(sublabel || trend) && (
                    <div className="flex items-center gap-2 mt-0.5">
                        {sublabel && (
                            <span className="text-xs text-text-muted">{sublabel}</span>
                        )}
                        {trend && (
                            <span
                                className={`text-xs font-medium flex items-center gap-0.5 ${
                                    trend.direction === 'up'
                                        ? 'text-success'
                                        : trend.direction === 'down'
                                            ? 'text-error'
                                            : 'text-text-muted'
                                }`}
                            >
                                <Icon
                                    name={
                                        trend.direction === 'up'
                                            ? 'TrendingUp'
                                            : trend.direction === 'down'
                                                ? 'TrendingDown'
                                                : 'Minus'
                                    }
                                    className="w-3 h-3"
                                />
                                {trend.value}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default StatCard;
