import React from 'react';
import { motion } from 'framer-motion';

/**
 * Page
 *
 * Canonical wrapper used by every top-level page in the app. Provides:
 *   - the standard `min-h-screen bg-background` chrome
 *   - a centered max-width container with consistent horizontal padding
 *   - vertical padding that matches across pages so the gap below the
 *     fixed Header is identical everywhere
 *   - a soft entrance animation for visual continuity between routes
 *
 * Pages should NOT add their own `pt-20` / `max-w-*` / `bg-background` —
 * use this wrapper so layouts stay aligned.
 */
const widthMap = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none',
};

const Page = ({
    children,
    width = 'xl',
    className = '',
    contentClassName = '',
    animate = true,
    background = 'default', // 'default' | 'gradient' | 'none'
}) => {
    const widthCls = widthMap[width] || widthMap.xl;

    const backgroundCls =
        background === 'gradient'
            ? 'min-h-screen bg-gradient-to-br from-background via-background to-surface/40'
            : background === 'none'
                ? 'min-h-screen'
                : 'min-h-screen bg-background';

    const Inner = animate ? motion.div : 'div';
    const motionProps = animate
        ? { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } }
        : {};

    return (
        <div className={`${backgroundCls} ${className}`}>
            <Inner
                {...motionProps}
                className={`${widthCls} mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${contentClassName}`}
            >
                {children}
            </Inner>
        </div>
    );
};

export default Page;
