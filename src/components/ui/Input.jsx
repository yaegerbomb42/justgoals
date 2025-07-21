import React, { forwardRef } from "react";

const Input = forwardRef(({ className = "", type = "text", ...props }, ref) => {

    // CheckBox-specific styles - enhanced with comprehensive theming
    if (type === "checkbox") {
        const checkboxClass =
            "h-4 w-4 mx-1 rounded border border-border bg-background text-primary focus:ring-2 focus:ring-form-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

        return (
            <input
                type="checkbox"
                className={checkboxClass}
                ref={ref}
                {...props}
            />
        );
    }

    // Radio button-specific styles - enhanced with comprehensive theming
    if (type === "radio") {
        const radioClass =
            "h-4 w-4 mx-1 rounded-full border border-border bg-background text-primary focus:ring-2 focus:ring-form-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

        return (
            <input
                type="radio"
                className={radioClass + " " + className}
                ref={ref}
                {...props}
            />
        );
    }

    const baseClass =
        "flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-base text-text-primary ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-form-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

    return (
        <input
            type={type}
            className={baseClass + " " + className}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = "Input";

export default Input;
