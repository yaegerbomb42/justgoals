import React from 'react';

/**
 * Card
 *
 * Shared card surface used across the app. Variants:
 *   - default  → solid surface, subtle border
 *   - elevated → solid surface, soft drop-shadow on hover
 *   - glass    → translucent surface with backdrop blur
 *   - gradient → faint primary→secondary tint
 *
 * Use this everywhere instead of writing `bg-surface border border-border
 * rounded-lg p-…` ad-hoc. Padding is configurable via the `padding` prop.
 */
const paddingMap = {
    none: '',
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
};

const variantMap = {
    default: 'bg-surface border border-border',
    elevated: 'bg-surface border border-border shadow-sm hover:shadow-md transition-shadow',
    glass: 'bg-surface/70 backdrop-blur-xl border border-border/40',
    gradient: 'bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-border/40',
    outline: 'border border-border bg-transparent',
};

const Card = React.forwardRef(({
    children,
    variant = 'default',
    padding = 'md',
    interactive = false,
    className = '',
    as: Component = 'div',
    ...rest
}, ref) => {
    const variantCls = variantMap[variant] || variantMap.default;
    const paddingCls = paddingMap[padding] ?? paddingMap.md;
    const interactiveCls = interactive
        ? 'cursor-pointer hover:border-primary/40 hover:shadow-md transition-all'
        : '';

    return (
        <Component
            ref={ref}
            className={`rounded-xl ${variantCls} ${paddingCls} ${interactiveCls} ${className}`.trim()}
            {...rest}
        >
            {children}
        </Component>
    );
});

Card.displayName = 'Card';

export default Card;
