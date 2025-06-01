"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Textarea component props that extend the standard HTML textarea attributes.
 * This interface exists to provide a consistent API with other UI components
 * and to allow for future extension with custom props as needed.
 * @see https://www.typescriptlang.org/docs/handbook/interfaces.html#extending-interfaces
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Optional custom styling variant for the textarea.
   * This property allows for future extension of the component with different visual styles.
   */
  variant?: "default" | "filled" | "outline";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
