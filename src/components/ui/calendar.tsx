"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3 bg-white rounded-xl shadow-sm border", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: "text-lg font-bold text-slate-800",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",

                // --- NATIVE TABLE LAYOUT ---
                // We use native table for 100% stable alignment of dates
                table: "w-full border-collapse",

                // --- HIDE HEADER ---
                // User explicitly requested to remove the header because of alignment issues.
                head_row: "hidden",

                // Row Styles
                row: "w-full mt-2",

                // Cell Styles
                cell: "h-12 w-12 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-transparent",

                // Day Button Styles
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-12 w-12 p-0 font-normal aria-selected:opacity-100 rounded-full mx-auto",
                    "hover:bg-slate-100 hover:text-slate-900",
                    "aria-selected:bg-emerald-500 aria-selected:text-white aria-selected:hover:bg-emerald-600 aria-selected:hover:text-white aria-selected:font-bold aria-selected:shadow-md"
                ),

                day_range_end: "day-range-end",
                day_selected:
                    "bg-emerald-500 text-white hover:bg-emerald-600 focus:bg-emerald-600 shadow-md transform scale-105 transition-all duration-200 ease-in-out font-bold rounded-full !opacity-100",

                day_today: "bg-slate-100 text-slate-900 font-bold rounded-full",

                day_outside:
                    "day-outside text-muted-foreground opacity-50 aria-selected:bg-emerald-500/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-5 w-5" />,
                IconRight: ({ ...props }) => <ChevronRight className="h-5 w-5" />,
                // Explicitly nullify Head component just to be safe, though CSS hidden should work.
                Head: () => null,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
