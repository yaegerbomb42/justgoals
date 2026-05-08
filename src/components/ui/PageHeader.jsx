import React from 'react';
import Icon from '../AppIcon';

/**
 * PageHeader
 *
 * Canonical page header used at the top of every main page.
 *
 *   <PageHeader
 *      icon="UtensilsCrossed"
 *      title="Meals"
 *      subtitle="Plan and track your macro-optimized meals"
 *      actions={<Button>...</Button>}
 *   />
 *
 * Renders a gradient icon tile, a heading, an optional subtitle, and a
 * right-aligned slot for action buttons. Keeps spacing consistent across
 * dashboards (Goals, Habits, Meals, Journal, Progress, Analytics, etc.).
 */
const PageHeader = ({
    icon,
    iconElement,
    title,
    subtitle,
    actions,
    badge,
    className = '',
    align = 'between',
}) => {
    const layoutCls =
        align === 'center'
            ? 'flex flex-col items-center text-center gap-4'
            : 'flex flex-col md:flex-row md:items-center md:justify-between gap-4';

    return (
        <header className={`mb-6 sm:mb-8 ${className}`}>
            <div className={layoutCls}>
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {(icon || iconElement) && (
                        <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                            {iconElement || (
                                <Icon name={icon} className="w-6 h-6 text-white" />
                            )}
                        </div>
                    )}

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-heading-bold text-text-primary tracking-tight truncate">
                                {title}
                            </h1>
                            {badge && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                                    {badge}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-sm sm:text-base text-text-secondary mt-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {actions && (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:flex-shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </header>
    );
};

export default PageHeader;
