import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "muted" | "danger";
  size?: "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "lg", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-center select-none border border-transparent";

    const variantStyles = {
      primary: "bg-primary text-primary-foreground hover:opacity-90",
      secondary: "bg-secondary text-secondary-foreground border border-border hover:opacity-90",
      muted: "bg-background text-foreground border border-border hover:bg-muted",
      danger: "bg-red-800 text-white hover:bg-red-900",
    };

    const sizeStyles = {
      md: "px-5 py-2.5 text-base min-h-[48px]",
      lg: "px-7 py-3 text-lg min-h-[52px] tracking-wide"
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
