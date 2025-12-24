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

                // --- FORCE CSS GRID LAYOUT ---
                // Override all table display styles to ensure pure 7-column alignment
                table: "!grid w-full",

                // Head (Weekdays)
                tbody: "!grid w-full gap-2",
                head_row: "!grid grid-cols-7 w-full mb-2",
                head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex justify-center items-center text-slate-500",

                // Row Styles
                row: "!grid grid-cols-7 w-full gap-y-2 mt-0",

                // Cell Styles
                // Force 100% width/height alignment within grid cell
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-transparent aspect-square flex justify-center items-center",

                // Day Button Styles
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-full w-full p-0 font-normal aria-selected:opacity-100 rounded-full text-slate-900 opacity-100 aspect-square",
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
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
