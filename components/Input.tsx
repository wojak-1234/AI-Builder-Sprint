import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, helperText, error, errorMessage, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2.5 w-full text-left">
        {label && (
          <div className="flex justify-between items-end">
            <label className="text-lg font-serif font-bold text-primary select-none">
              {label}
            </label>
            {error && errorMessage && (
              <span className="text-sm font-sans font-semibold text-destructive select-none">
                {errorMessage}
              </span>
            )}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3.5 text-base bg-background border ${
            error ? "border-destructive focus:ring-destructive/10" : "border-border focus:border-primary focus:ring-primary/5"
          } rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all duration-200 ${className}`}
          {...props}
        />
        {helperText && (
          <p className={`text-xs ${error ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
};

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = "", label, helperText, error, errorMessage, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2.5 w-full text-left">
        {label && (
          <div className="flex justify-between items-end">
            <label className="text-lg font-serif font-bold text-primary select-none">
              {label}
            </label>
            {error && errorMessage && (
              <span className="text-sm font-sans font-semibold text-destructive select-none">
                {errorMessage}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-3.5 text-base bg-background border ${
            error ? "border-destructive focus:ring-destructive/10" : "border-border focus:border-primary focus:ring-primary/5"
          } rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all duration-200 resize-none min-h-[140px] leading-loose ${className}`}
          {...props}
        />
        {helperText && (
          <p className={`text-xs ${error ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
