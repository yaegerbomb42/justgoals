import React from 'react';
import Icon from 'components/AppIcon';

const Button = React.forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    shape = 'rounded',
    fullWidth = false,
    disabled = false,
    loading = false,
    icon = null,
    iconName = null,
    iconPosition = 'left',
    type = 'button',
    iconSize = null,
    iconColor = null,
    className = '',
    onClick,
    ...rest
}, ref) => {
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center transition-all duration-200 font-medium focus:ring-2 focus:outline-none';

    // Size classes
    const sizeClasses = {
        '2xs': 'text-xs py-0.5 px-1.5',
        xs: 'text-xs py-1 px-2',
        sm: 'text-sm py-1.5 px-3',
        md: 'text-base py-2 px-4',
        lg: 'text-lg py-2.5 px-5',
        xl: 'text-xl py-3 px-6',
        '2xl': 'text-2xl py-4 px-8',
    };

    // Shape classes
    const shapeClasses = {
        rounded: 'rounded',
        square: 'rounded-none',
        pill: 'rounded-full',
        circle: 'rounded-full aspect-square',
    };

    // Variant classes - enhanced with comprehensive theming
    const variantClasses = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary/50',
        success: 'bg-success text-success-foreground hover:bg-success/90 focus:ring-success/50',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive/50',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90 focus:ring-warning/50',
        info: 'bg-accent text-accent-foreground hover:bg-accent/90 focus:ring-accent/50',
        ghost: 'hover:bg-button-ghost-hover hover:text-primary-foreground focus:ring-ring/50',
        link: 'bg-transparent text-primary underline hover:text-primary/80 p-0 focus:ring-ring/50',
        outline: 'border border-button-outline-border bg-background hover:bg-primary hover:text-primary-foreground focus:ring-ring/50',
        text: 'bg-transparent text-primary hover:bg-muted/10 active:bg-muted/20 focus:ring-ring/50',
        muted: 'bg-muted text-muted-foreground hover:bg-muted/80 focus:ring-muted/50',
        card: 'bg-card text-card-foreground hover:bg-card/80 border border-border focus:ring-ring/50',
    };


    // Width classes
    const widthClasses = fullWidth ? 'w-full' : '';

    // Disabled classes
    const disabledClasses = disabled ? 'cursor-not-allowed opacity-60' : '';

    // Loading state
    const loadingContent = loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    ) : null;

    // Icon rendering
    const renderIcon = () => {
        if (iconName) {
            // Use AppIcon component when iconName is provided
            const iconSizeMap = {
                '2xs': 12,
                xs: 14,
                sm: 16,
                md: 18,
                lg: 20,
                xl: 22,
                '2xl': 24,
            };

            const calculatedSize = iconSize || iconSizeMap[size] || 18;

            return (
                <span style={{ color: iconColor || 'currentColor' }}>
                    <Icon
                        name={iconName}
                        size={calculatedSize}
                        className={`${children ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') : ''}`}
                    />
                </span>

            );
        }

        if (!icon) return null;

        return React.cloneElement(icon, {
            className: `${children ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') : ''} h-5 w-5`
        });
    };

    // Combine all classes
    const classes = `
                    ${baseClasses}
                    ${sizeClasses[size] || sizeClasses.md}
                    ${shapeClasses[shape] || shapeClasses.rounded}
                    ${variantClasses[variant] || variantClasses.primary}
                    ${widthClasses}
                    ${disabledClasses}
                    ${className}
                    `;

    return (
        <button
            ref={ref}
            type={type}
            className={classes}
            disabled={disabled || loading}
            onClick={onClick}
            {...rest}
        >
            {loading && loadingContent}
            {(icon || iconName) && iconPosition === 'left' && renderIcon()}
            {children}
            {(icon || iconName) && iconPosition === 'right' && renderIcon()}
        </button>
    );
});

export default Button;