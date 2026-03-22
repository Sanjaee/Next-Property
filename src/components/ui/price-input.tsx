"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatPriceDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits === "") return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parsePriceValue(displayValue: string): string {
  return displayValue.replace(/\D/g, "");
}

const PriceInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, value, onChange, ...props }, ref) => {
  const [displayValue, setDisplayValue] = React.useState(() =>
    typeof value === "string" ? formatPriceDisplay(value) : ""
  );

  React.useEffect(() => {
    const parsed = typeof value === "string" ? value.replace(/\D/g, "") : "";
    setDisplayValue(formatPriceDisplay(parsed));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parsePriceValue(e.target.value);
    setDisplayValue(formatPriceDisplay(raw));
    const syntheticEvent = {
      ...e,
      target: { ...e.target, value: raw },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange?.(syntheticEvent);
  };

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={displayValue}
      onChange={handleChange}
      className={cn(className)}
      {...props}
    />
  );
});

PriceInput.displayName = "PriceInput";

export { PriceInput };
