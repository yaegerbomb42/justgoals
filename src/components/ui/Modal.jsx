import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';

/**
 * Modal
 *
 * Unified modal shell. Replaces the many ad-hoc
 *   `<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">`
 * blocks that vary slightly across the app.
 *
 *   <Modal isOpen={open} onClose={…} title="Add Event" icon="Calendar">
 *     {body}
 *   </Modal>
 */
const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
};

const Modal = ({
    isOpen,
    onClose,
    title,
    icon,
    description,
    children,
    footer,
    size = 'md',
    closeOnBackdrop = true,
    showClose = true,
    className = '',
    bodyClassName = '',
}) => {
    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape' && onClose) onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    // Lock background scroll while open
    useEffect(() => {
        if (!isOpen) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = original; };
    }, [isOpen]);

    const widthCls = sizeMap[size] || sizeMap.md;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => closeOnBackdrop && onClose && onClose()}
                    role="dialog"
                    aria-modal="true"
                    aria-label={typeof title === 'string' ? title : undefined}
                >
                    <motion.div
                        key="modal-panel"
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full ${widthCls} bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden ${className}`}
                    >
                        {(title || icon || showClose) && (
                            <div className="flex items-start gap-3 px-5 sm:px-6 py-4 border-b border-border/60">
                                {icon && (
                                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                        <Icon name={icon} className="w-5 h-5 text-white" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    {title && (
                                        <h2 className="text-lg font-heading-semibold text-text-primary truncate">
                                            {title}
                                        </h2>
                                    )}
                                    {description && (
                                        <p className="text-sm text-text-secondary mt-0.5">{description}</p>
                                    )}
                                </div>
                                {showClose && (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-shrink-0 -mr-1 p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-700/40 rounded-lg transition-colors"
                                        aria-label="Close"
                                    >
                                        <Icon name="X" className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                        <div className={`px-5 sm:px-6 py-5 max-h-[70vh] overflow-y-auto ${bodyClassName}`}>
                            {children}
                        </div>
                        {footer && (
                            <div className="px-5 sm:px-6 py-3 border-t border-border/60 bg-surface-700/20 flex flex-wrap items-center justify-end gap-2">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
