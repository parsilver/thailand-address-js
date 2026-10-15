"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { useMediaQuery } from "./use-media-query"

export type PickerOption = {
  value: string
  label: string
  /** A second line, e.g. "อ.บ้านแพรก › พระนครศรีอยุธยา". */
  description?: string
  /** Extra text the list's own search matches, e.g. the English name. */
  keywords?: string[]
}

type AddressPickerProps = {
  id: string
  label: string
  options: PickerOption[]
  value: string | null
  onValueChange: (value: string) => void
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  /** Shown as a heading over the list, e.g. "10200 · เขตพระนคร". */
  groupHeading?: string
  disabled?: boolean
  invalid?: boolean
  loading?: boolean
  describedBy?: string
  onOpen?: () => void
}

/**
 * A select with a search field: Popover + Command on desktop, a bottom Drawer
 * below 640px (shadcn's responsive combobox). The trigger is the labelled
 * control, so <Label htmlFor={id}> names it.
 */
export function AddressPicker({
  id,
  label,
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  groupHeading,
  disabled,
  invalid,
  loading,
  describedBy,
  onOpen,
}: AddressPickerProps) {
  const [open, setOpen] = React.useState(false)
  const desktop = useMediaQuery("(min-width: 640px)")
  const listId = `${id}-list`
  const selected = options.find((o) => o.value === value)

  const setOpenAndNotify = (next: boolean) => {
    setOpen(next)
    if (next) onOpen?.()
  }

  const select = (v: string) => {
    onValueChange(v)
    setOpen(false)
  }

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-haspopup="listbox"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      disabled={disabled}
      className={cn(
        "w-full justify-between font-normal",
        !selected && "text-muted-foreground"
      )}
    >
      <span className="truncate">
        {selected ? selected.label : placeholder}
      </span>
      {loading ? (
        <Loader2Icon
          aria-hidden
          className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
        />
      ) : (
        <ChevronsUpDownIcon
          aria-hidden
          className="size-4 shrink-0 opacity-50"
        />
      )}
    </Button>
  )

  const list = (
    <Command
      filter={(itemValue, search, keywords) => {
        const q = search.toLowerCase().replace(/\s+/g, "")
        const hay = [itemValue, ...(keywords ?? [])]
          .join(" ")
          .toLowerCase()
          .replace(/\s+/g, "")
        return hay.includes(q) ? 1 : 0
      }}
    >
      <CommandInput
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
      />
      <CommandList
        id={listId}
        aria-label={label}
        className={cn(!desktop && "max-h-[60vh]")}
      >
        <CommandEmpty>{emptyText}</CommandEmpty>
        <CommandGroup heading={groupHeading}>
          {options.map((o) => (
            <CommandItem
              key={o.value}
              value={`${o.label} ${o.value}`}
              keywords={o.keywords ?? []}
              onSelect={() => select(o.value)}
              className={cn(!desktop && "min-h-11")}
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{o.label}</span>
                {o.description ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {o.description}
                  </span>
                ) : null}
              </span>
              <CheckIcon
                aria-hidden
                className={cn(
                  "ml-auto size-4",
                  o.value === value ? "opacity-100" : "opacity-0"
                )}
              />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )

  if (desktop) {
    return (
      <Popover open={open} onOpenChange={setOpenAndNotify}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) min-w-56 p-0"
          align="start"
        >
          {list}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpenAndNotify}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{label}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {searchPlaceholder}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-2 pb-4">{list}</div>
      </DrawerContent>
    </Drawer>
  )
}
