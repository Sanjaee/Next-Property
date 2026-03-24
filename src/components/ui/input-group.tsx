"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "group/input-group flex w-full min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-background shadow-xs",
        "has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50",
        className
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  "text-muted-foreground flex h-auto cursor-default select-none items-center justify-center gap-2 py-1.5 text-sm font-medium [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start":
          "order-first border-r border-input pl-3 pr-2 has-[>button]:pl-1",
        "inline-end":
          "order-last border-l border-input pr-1 pl-2 has-[>button]:pr-0",
        "block-start":
          "order-first w-full border-b border-input px-3 pt-3 pb-2",
        "block-end":
          "order-last w-full border-t border-input px-3 pb-3 pt-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
);

function InputGroupAddon({
  className,
  align = "inline-start",
  onClick,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="presentation"
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        const root = e.currentTarget.closest('[data-slot="input-group"]');
        root?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input,textarea")?.focus();
        onClick?.(e);
      }}
      {...props}
    />
  );
}

const inputGroupButtonVariants = cva("shadow-none", {
  variants: {
    size: {
      xs: "h-6 gap-1 rounded-[calc(var(--radius)-5px)] px-2 text-xs has-[>svg]:px-2 [&>svg:not([class*='size-'])]:size-3.5",
      sm: "h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5",
      "icon-xs":
        "size-7 shrink-0 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0 [&>svg:not([class*='size-'])]:size-4",
      "icon-sm": "size-8 shrink-0 p-0 has-[>svg]:p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      variant={variant}
      size="icon"
      className={cn(
        "shadow-none shrink-0",
        inputGroupButtonVariants({ size }),
        className
      )}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-text"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-input"
      className={cn(
        "flex-1 min-w-0 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
        className
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-textarea"
      className={cn(
        "min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none focus-visible:ring-0 dark:bg-transparent",
        className
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
