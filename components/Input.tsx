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
              <span className="text-sm font-sans font-semibold text-red-650 dark:text-red-400 select-none">
                {errorMessage}
              </span>
            )}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3.5 text-base bg-background border ${
            error ? "border-red-600 focus:ring-red-600/10" : "border-border focus:border-primary focus:ring-primary/5"
          } rounded-xl text-foreground placeholder-zinc-450 focus:outline-none focus:ring-2 transition-all duration-200 ${className}`}
          {...props}
        />
        {helperText && (
          <p className={`text-xs ${error ? "text-red-600 font-medium" : "text-zinc-500"}`}>
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
              <span className="text-sm font-sans font-semibold text-red-650 dark:text-red-400 select-none">
                {errorMessage}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-3.5 text-base bg-background border ${
            error ? "border-red-600 focus:ring-red-600/10" : "border-border focus:border-primary focus:ring-primary/5"
          } rounded-xl text-foreground placeholder-zinc-450 focus:outline-none focus:ring-2 transition-all duration-200 resize-none min-h-[140px] leading-loose ${className}`}
          {...props}
        />
        {helperText && (
          <p className={`text-xs ${error ? "text-red-600 font-medium" : "text-zinc-500"}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
