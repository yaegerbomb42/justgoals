import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';

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
    glow = false,
    ...rest
}, ref) => {
    // Size configurations
    const sizeConfig = {
        '2xs': { padding: 'py-1 px-2', text: 'text-xs', icon: 12 },
        xs: { padding: 'py-1.5 px-2.5', text: 'text-xs', icon: 14 },
        sm: { padding: 'py-2 px-3', text: 'text-sm', icon: 16 },
        md: { padding: 'py-2.5 px-4', text: 'text-sm', icon: 18 },
        lg: { padding: 'py-3 px-5', text: 'text-base', icon: 20 },
        xl: { padding: 'py-3.5 px-6', text: 'text-lg', icon: 22 },
        '2xl': { padding: 'py-4 px-8', text: 'text-xl', icon: 24 },
    };

    // Shape configurations
    const shapeConfig = {
        rounded: 'rounded-xl',
        square: 'rounded-none',
        pill: 'rounded-full',
        circle: 'rounded-full aspect-square',
    };

    // Variant configurations with modern gradients
    const variantConfig = {
        primary: {
            base: 'bg-gradient-to-r from-primary to-secondary text-white',
            hover: 'hover:shadow-lg hover:shadow-primary/30',
            active: 'active:scale-[0.98]',
            glow: 'shadow-lg shadow-primary/25',
        },
        secondary: {
            base: 'bg-surface-700/50 text-text-primary border border-border/50',
            hover: 'hover:bg-surface-700 hover:border-border',
            active: 'active:scale-[0.98]',
            glow: '',
        },
        success: {
            base: 'bg-gradient-to-r from-success to-emerald-400 text-white',
            hover: 'hover:shadow-lg hover:shadow-success/30',
            active: 'active:scale-[0.98]',
            glow: 'shadow-lg shadow-success/25',
        },
        danger: {
            base: 'bg-gradient-to-r from-error to-rose-500 text-white',
            hover: 'hover:shadow-lg hover:shadow-error/30',
            active: 'active:scale-[0.98]',
            glow: 'shadow-lg shadow-error/25',
        },
        warning: {
            base: 'bg-gradient-to-r from-warning to-orange-400 text-white',
            hover: 'hover:shadow-lg hover:shadow-warning/30',
            active: 'active:scale-[0.98]',
            glow: 'shadow-lg shadow-warning/25',
        },
        info: {
            base: 'bg-gradient-to-r from-accent to-cyan-400 text-white',
            hover: 'hover:shadow-lg hover:shadow-accent/30',
            active: 'active:scale-[0.98]',
            glow: 'shadow-lg shadow-accent/25',
        },
        ghost: {
            base: 'bg-transparent text-text-secondary',
            hover: 'hover:bg-surface-700/50 hover:text-text-primary',
            active: 'active:bg-surface-700',
            glow: '',
        },
        link: {
            base: 'bg-transparent text-primary underline-offset-4',
            hover: 'hover:underline hover:text-primary/80',
            active: '',
            glow: '',
        },
        outline: {
            base: 'bg-transparent text-text-primary border border-border/50',
            hover: 'hover:bg-primary hover:text-white hover:border-primary',
            active: 'active:scale-[0.98]',
            glow: '',
        },
        text: {
            base: 'bg-transparent text-text-secondary',
            hover: 'hover:text-text-primary hover:bg-surface-700/30',
            active: 'active:bg-surface-700/50',
            glow: '',
        },
        muted: {
            base: 'bg-surface-700/30 text-text-secondary border border-border/30',
            hover: 'hover:bg-surface-700/50 hover:text-text-primary',
            active: 'active:scale-[0.98]',
            glow: '',
        },
        card: {
            base: 'bg-surface/60 backdrop-blur-sm text-text-primary border border-border/30',
            hover: 'hover:bg-surface/80 hover:border-border/50',
            active: 'active:scale-[0.98]',
            glow: '',
        },
        gradient: {
            base: 'bg-gradient-to-r from-primary via-secondary to-accent text-white',
            hover: 'hover:shadow-xl hover:shadow-primary/20',
            active: 'active:scale-[0.98]',
            glow: 'shadow-lg shadow-primary/20',
        },
    };

    const currentSize = sizeConfig[size] || sizeConfig.md;
    const currentShape = shapeConfig[shape] || shapeConfig.rounded;
    const currentVariant = variantConfig[variant] || variantConfig.primary;

    // Loading spinner
    const loadingContent = loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    ) : null;

    // Icon rendering
    const renderIcon = () => {
        if (iconName) {
            const calculatedSize = iconSize || currentSize.icon;
            return (
                <Icon
                    name={iconName}
                    size={calculatedSize}
                    color={iconColor || 'currentColor'}
                    className={children ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') : ''}
                />
            );
        }

        if (!icon) return null;

        return React.cloneElement(icon, {
            className: `${children ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') : ''} h-5 w-5`
        });
    };

    const classes = `
        inline-flex items-center justify-center font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background
        ${currentSize.padding}
        ${currentSize.text}
        ${currentShape}
        ${currentVariant.base}
        ${currentVariant.hover}
        ${currentVariant.active}
        ${glow ? currentVariant.glow : ''}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
        <motion.button
            ref={ref}
            type={type}
            className={classes}
            disabled={disabled || loading}
            onClick={onClick}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            {...rest}
        >
            {loading && loadingContent}
            {(icon || iconName) && iconPosition === 'left' && renderIcon()}
            {children}
            {(icon || iconName) && iconPosition === 'right' && renderIcon()}
        </motion.button>
    );
});

Button.displayName = 'Button';

export default Button;
