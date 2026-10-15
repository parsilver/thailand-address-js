/**
 * Text tabs with an accent underline, layered on the shadcn `line` variant.
 * MODE_* is the page-level row (40px targets on a full-width rule);
 * FORMAT_* is the small row beside the payload.
 */
export const MODE_LIST =
  "h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b p-0 [scrollbar-width:none] max-md:gap-4.5 group-data-horizontal/tabs:h-auto"
export const MODE_TRIGGER =
  "h-10 flex-none px-0 text-sm font-normal text-muted-foreground after:bg-site-accent group-data-horizontal/tabs:after:bottom-[-1px] data-active:text-foreground"
export const FORMAT_LIST =
  "h-auto gap-3.5 p-0 group-data-horizontal/tabs:h-auto"
export const FORMAT_TRIGGER =
  "h-7 flex-none px-0 text-[13px] font-normal text-muted-foreground after:bg-site-accent group-data-horizontal/tabs:after:bottom-0 data-active:text-foreground"
