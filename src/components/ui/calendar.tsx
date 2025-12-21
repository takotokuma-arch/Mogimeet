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
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: "text-lg font-bold text-slate-800",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",

                // --- STRICT GRID IMPLEMENTATION ---

                // 1. Reset Table Semantics to Blocks
                table: "w-full border-collapse block",
                head: "w-full block",
                tbody: "w-full block",

                // 2. Force 7-Column Grid on Rows
                head_row: "grid grid-cols-7 w-full mb-2",
                row: "grid grid-cols-7 w-full mt-2",

                // 3. Reset Flex/centering on cells to allow Grid to control width
                head_cell: "text-muted-foreground w-full font-normal text-sm text-center flex justify-center items-center h-10",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-transparent w-full h-14 flex justify-center items-center",

                // 4. Day Button Styling (Lettucemeet)
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-12 w-12 p-0 font-normal aria-selected:opacity-100 rounded-full",
                    "aria-selected:bg-emerald-500 aria-selected:text-white aria-selected:hover:bg-emerald-600 aria-selected:hover:text-white aria-selected:font-bold"
                ),

                day_range_end: "day-range-end",
                day_selected:
                    "bg-emerald-500 text-white hover:bg-emerald-600 focus:bg-emerald-600 shadow-md font-bold rounded-full !opacity-100",
                day_today: "bg-slate-100 text-slate-900 font-bold rounded-full border border-slate-200",
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
