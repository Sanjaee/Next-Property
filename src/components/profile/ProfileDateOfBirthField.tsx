"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";

function parseYyyyMmDd(s: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

function toYyyyMmDd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ProfileDateOfBirthField({
  id = "dateOfBirth",
  value,
  onValueChange,
  "data-field": dataField,
}: {
  id?: string;
  value: string;
  onValueChange: (v: string) => void;
  "data-field"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  React.useEffect(() => {
    if (!value) {
      setDate(undefined);
      return;
    }
    const parsed = parseYyyyMmDd(value);
    if (parsed) {
      setDate(parsed);
    }
  }, [value]);

  return (
    <Field className="w-full" data-field={dataField}>
      <FieldLabel htmlFor={id}>Tanggal lahir</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id={id}
            data-field={dataField}
            className="w-full justify-between font-normal border-border bg-background"
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            {date ? format(date, "PPP", { locale: localeId }) : "Pilih tanggal"}
            <ChevronDownIcon className="size-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align="start"
          sideOffset={8}
        >
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            defaultMonth={date}
            disabled={(d) => d > new Date()}
            onSelect={(d) => {
              if (d) {
                setDate(d);
                onValueChange(toYyyyMmDd(d));
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
