import React from 'react';
import Icon from '../AppIcon';

/**
 * EmptyState
 *
 * Used wherever a list / dashboard / tab has no content yet.
 * Replaces the various inline "no data" blocks scattered across pages.
 *
 *   <EmptyState
 *     icon="Trophy"
 *     title="No achievements yet"
 *     description="Keep working on your goals to unlock achievements!"
 *     action={<Button>Create one</Button>}
 *   />
 */
const EmptyState = ({
    icon = 'Inbox',
    title,
    description,
    action,
    secondaryAction,
    className = '',
    size = 'md', // 'sm' | 'md' | 'lg'
}) => {
    const sizeCls = {
        sm: { wrap: 'py-6', icon: 'w-12 h-12', iconInner: 'w-6 h-6', title: 'text-base', desc: 'text-xs' },
        md: { wrap: 'py-10', icon: 'w-16 h-16', iconInner: 'w-8 h-8', title: 'text-lg', desc: 'text-sm' },
        lg: { wrap: 'py-16', icon: 'w-20 h-20', iconInner: 'w-10 h-10', title: 'text-xl', desc: 'text-base' },
    }[size] || {};

    return (
        <div className={`flex flex-col items-center justify-center text-center ${sizeCls.wrap} ${className}`}>
            <div className={`${sizeCls.icon} rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-border/40 flex items-center justify-center mb-4`}>
                <Icon name={icon} className={`${sizeCls.iconInner} text-primary`} />
            </div>
            {title && (
                <h3 className={`${sizeCls.title} font-heading-semibold text-text-primary mb-1`}>
                    {title}
                </h3>
            )}
            {description && (
                <p className={`${sizeCls.desc} text-text-secondary max-w-md mb-4`}>
                    {description}
                </p>
            )}
            {(action || secondaryAction) && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    {action}
                    {secondaryAction}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
