"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

// Componente Input de shadcn/ui adaptado a los estilos del sistema.
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  (
    {
      className,
      type,
      onInvalid,
      onChange,
      "aria-describedby": descrito,
      ...props
    },
    ref,
  ) => {
    const [error, setError] = React.useState("");
    const id = React.useId(),
      errorId = `${id}-error`;
    return (
      <>
        <input
          type={type}
          className={cn(
            type !== "checkbox" &&
              type !== "radio" &&
              "flex min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-700",
            className,
          )}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [descrito, error ? errorId : null].filter(Boolean).join(" ") ||
            undefined
          }
          onInvalid={(e) => {
            setError(e.currentTarget.validationMessage);
            onInvalid?.(e);
          }}
          onChange={(e) => {
            e.currentTarget.setCustomValidity("");
            setError("");
            onChange?.(e);
          }}
          {...props}
        />
        {error && (
          <span
            id={errorId}
            role="alert"
            className="block text-sm font-normal text-red-700 mt-1"
          >
            {error}
          </span>
        )}
      </>
    );
  },
);
Input.displayName = "Input";
export { Input };
