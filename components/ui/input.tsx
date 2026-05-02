import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "block h-11 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-2 focus-visible:ring-sky-200 sm:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
