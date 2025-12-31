import React, { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import Icon from "../AppIcon";

const Input = forwardRef(({ 
    className = "", 
    type = "text", 
    label = "",
    error = "",
    hint = "",
    leftIcon = null,
    rightIcon = null,
    variant = "default",
    size = "md",
    ...props 
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    // Size configurations
    const sizeConfig = {
        sm: { padding: 'py-2 px-3', text: 'text-sm', icon: 16 },
        md: { padding: 'py-3 px-4', text: 'text-base', icon: 18 },
        lg: { padding: 'py-3.5 px-5', text: 'text-lg', icon: 20 },
    };

    const currentSize = sizeConfig[size] || sizeConfig.md;

    // Checkbox styles
    if (type === "checkbox") {
        return (
            <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        ref={ref}
                        {...props}
                    />
                    <div className="w-5 h-5 rounded-md bg-surface-700/50 border border-border/50 peer-checked:bg-gradient-to-br peer-checked:from-primary peer-checked:to-secondary peer-checked:border-transparent transition-all group-hover:border-primary/50">
                        <Icon 
                            name="Check" 
                            size={14} 
                            className="text-white opacity-0 peer-checked:opacity-100 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity"
                        />
                    </div>
                </div>
                {label && <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>}
            </label>
        );
    }

    // Radio button styles
    if (type === "radio") {
        return (
            <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                    <input
                        type="radio"
                        className="sr-only peer"
                        ref={ref}
                        {...props}
                    />
                    <div className="w-5 h-5 rounded-full bg-surface-700/50 border border-border/50 peer-checked:border-primary transition-all group-hover:border-primary/50">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-secondary opacity-0 peer-checked:opacity-100 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity" />
                    </div>
                </div>
                {label && <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>}
            </label>
        );
    }

    // Text area
    if (type === "textarea") {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-text-primary mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <textarea
                        ref={ref}
                        className={`
                            w-full rounded-xl bg-surface-700/30 border text-text-primary 
                            placeholder:text-text-muted resize-none
                            focus:outline-none focus:ring-2 focus:ring-primary/30 
                            transition-all duration-200
                            ${currentSize.padding} ${currentSize.text}
                            ${error ? 'border-error/50 focus:border-error focus:ring-error/30' : 'border-border/30 focus:border-primary/50'}
                            ${className}
                        `}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1.5 text-xs text-error flex items-center space-x-1">
                        <Icon name="AlertCircle" size={12} />
                        <span>{error}</span>
                    </p>
                )}
                {hint && !error && (
                    <p className="mt-1.5 text-xs text-text-muted">{hint}</p>
                )}
            </div>
        );
    }

    // Standard input
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-text-primary mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                {/* Focus glow effect */}
                <motion.div
                    initial={false}
                    animate={{
                        opacity: isFocused ? 1 : 0,
                        scale: isFocused ? 1 : 0.95,
                    }}
                    className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur-sm pointer-events-none"
                />
                
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted">
                            {typeof leftIcon === 'string' ? (
                                <Icon name={leftIcon} size={currentSize.icon} />
                            ) : leftIcon}
                        </div>
                    )}
                    
                    <input
                        type={inputType}
                        ref={ref}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className={`
                            w-full rounded-xl bg-surface-700/30 border text-text-primary 
                            placeholder:text-text-muted
                            focus:outline-none transition-all duration-200
                            ${currentSize.padding} ${currentSize.text}
                            ${leftIcon ? 'pl-10' : ''}
                            ${rightIcon || isPassword ? 'pr-10' : ''}
                            ${error 
                                ? 'border-error/50 focus:border-error' 
                                : 'border-border/30 hover:border-border/50 focus:border-primary/50'
                            }
                            ${className}
                        `}
                        {...props}
                    />
                    
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                        >
                            <Icon name={showPassword ? "EyeOff" : "Eye"} size={currentSize.icon} />
                        </button>
                    )}
                    
                    {rightIcon && !isPassword && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted">
                            {typeof rightIcon === 'string' ? (
                                <Icon name={rightIcon} size={currentSize.icon} />
                            ) : rightIcon}
                        </div>
                    )}
                </div>
            </div>
            
            {error && (
                <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-error flex items-center space-x-1"
                >
                    <Icon name="AlertCircle" size={12} />
                    <span>{error}</span>
                </motion.p>
            )}
            {hint && !error && (
                <p className="mt-1.5 text-xs text-text-muted">{hint}</p>
            )}
        </div>
    );
});

Input.displayName = "Input";

export default Input;
