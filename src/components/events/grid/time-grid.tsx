"use client"

import React, { useRef, useState, useCallback, useMemo, useEffect } from "react"
import { cn } from "@/lib/utils"
import { addMinutes, format, isSameDay, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"

type TimeSlot = {
    id: string
    start_at: string
}

type Availability = {
    response_id: string
    time_slot_id: string
}

interface TimeGridProps {
    timeSlots: TimeSlot[]
    userResponseId: string | null
    isAdmin: boolean
    eventId: string
    onAdminSelect?: (startSlotId: string, endSlotId: string) => void
}

export function TimeGrid({ timeSlots, userResponseId, isAdmin, eventId, onAdminSelect }: TimeGridProps) {
    const supabase = createClient()
    const containerRef = useRef<HTMLDivElement>(null)

    // State
    const [myAvailability, setMyAvailability] = useState<Set<string>>(new Set())
    // heatmapCounts[slotId] = number of people available
    const [heatmapCounts, setHeatmapCounts] = useState<Record<string, number>>({})
    const [totalResponders, setTotalResponders] = useState(0)

    const [isDragging, setIsDragging] = useState(false)
    const [dragMode, setDragMode] = useState<'add' | 'remove'>('add')
    const [lastEnteredSlotId, setLastEnteredSlotId] = useState<string | null>(null)

    // Admin State
    const [adminSelection, setAdminSelection] = useState<{ startSlotId: string, endSlotId: string } | null>(null)
    const [adminSelectedSlots, setAdminSelectedSlots] = useState<Set<string>>(new Set())

    // Process slots into a Grid Structure: structured[dateStr][timeStr] = Slot
    const { dates, gridData, timeLabels } = useMemo(() => {
        const dSet = new Set<string>()
        const tSet = new Set<string>()
        const g: Record<string, Record<string, TimeSlot>> = {}

        timeSlots.forEach(slot => {
            const date = parseISO(slot.start_at)
            const dateKey = format(date, 'yyyy-MM-dd')
            const timeKey = format(date, 'HH:mm')

            dSet.add(dateKey)
            tSet.add(timeKey)

            if (!g[dateKey]) g[dateKey] = {}
            g[dateKey][timeKey] = slot
        })

        const sortedDates = Array.from(dSet).sort()
        const sortedTimes = Array.from(tSet).sort()

        return { dates: sortedDates, timeLabels: sortedTimes, gridData: g }
    }, [timeSlots])

    // Load initial availability & Heatmap Data
    useEffect(() => {
        const fetchSystemData = async () => {
            // 1. My Availability
            if (userResponseId && userResponseId !== 'admin_mode') {
                const { data } = await supabase
                    .from('availability')
                    .select('time_slot_id')
                    .eq('response_id', userResponseId)
                if (data) {
                    setMyAvailability(new Set(data.map(d => d.time_slot_id)))
                }
            }

            // 2. Heatmap Data (All Availability)
            // Get responders for this event.
            const { data: responders } = await supabase.from('responses').select('id').eq('event_id', eventId)
            const responderIds = responders?.map(r => r.id) || []
            setTotalResponders(responderIds.length)

            if (responderIds.length > 0) {
                const { data: heat } = await supabase
                    .from('availability')
                    .select('time_slot_id')
                    .in('response_id', responderIds)

                if (heat) {
                    const counts: Record<string, number> = {}
                    heat.forEach(h => {
                        counts[h.time_slot_id] = (counts[h.time_slot_id] || 0) + 1
                    })
                    setHeatmapCounts(counts)
                }
            }
        }
        fetchSystemData()

        // Realtime Subscription
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'availability',
                },
                (payload) => {
                    console.log('Realtime update:', payload)
                    fetchSystemData()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userResponseId, supabase, eventId])


    // Pointer Events Handlers
    const toggleSlot = useCallback((slotId: string, mode: 'add' | 'remove') => {
        setMyAvailability(prev => {
            const next = new Set(prev)
            if (mode === 'add') {
                next.add(slotId)
            } else {
                next.delete(slotId)
            }
            return next
        })

        // Haptic Feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(8) // Tiny vibration
        }
    }, [])

    // Helper to calculate slots in rectangle
    const calculateAdminSelection = (startId: string, endId: string) => {
        let startPos: { d: number, t: number } | null = null
        let endPos: { d: number, t: number } | null = null

        dates.forEach((d, dIdx) => {
            timeLabels.forEach((t, tIdx) => {
                const s = gridData[d][t]
                if (s?.id === startId) startPos = { d: dIdx, t: tIdx }
                if (s?.id === endId) endPos = { d: dIdx, t: tIdx }
            })
        })

        if (!startPos || !endPos) return

        const minD = Math.min(startPos.d, endPos.d)
        const maxD = Math.max(startPos.d, endPos.d)
        const minT = Math.min(startPos.t, endPos.t)
        const maxT = Math.max(startPos.t, endPos.t)

        const selectedIds = new Array<string>()

        // Calculate matching count
        // For matching, we need to know: For EVERY slot in the selection, who is available?
        // A "Perfect Match" means a set of users who are available for ALL selected slots.
        // Simplified Match: "Min availability across selection". i.e. If slot A has 3 people, slot B has 2 people, the range has at most 2 people if they overlap.
        // Accurate Match: Intersection of availability sets for each slot.

        // We need availability sets per slot, not just counts.
        // Current heatmapCounts is just counts.
        // We'll trust the parent or just do a naive check if we don't have sets.
        // REAL IMPLEMENTATION (Ideal):
        // We need `heatmapSets: Record<string, Set<string>>` (slotId -> Set of userIds)
        // But for this MVP without major Refactor, let's just use the Min Count approximation or naive average.
        // Actually, to display "X / Y people", Min Count is the upper bound of possible group size.

        let minCount = 9999
        let sumCount = 0

        for (let d = minD; d <= maxD; d++) {
            for (let t = minT; t <= maxT; t++) {
                const dateKey = dates[d]
                const timeKey = timeLabels[t]
                const slot = gridData[dateKey][timeKey]
                if (slot) {
                    selectedIds.push(slot.id)
                    const c = heatmapCounts[slot.id] || 0
                    if (c < minCount) minCount = c
                    sumCount += c
                }
            }
        }


        if (selectedIds.length === 0) setAdminSelection(null)
        setAdminSelectedSlots(new Set(selectedIds))

        // Notify parent
        if (onAdminSelect && selectedIds.length > 0) {
            onAdminSelect(startId, endId)
        }
    }

    const handlePointerDown = (e: React.PointerEvent, slotId: string) => {
        e.preventDefault()
        // Admin Mode Logic
        if (isAdmin && userResponseId === 'admin_mode') {
            setIsDragging(true)
            setAdminSelection({ startSlotId: slotId, endSlotId: slotId })
            setAdminSelectedSlots(new Set([slotId]))
            setLastEnteredSlotId(slotId)
            return
        }

        if (!userResponseId) return

        const target = e.currentTarget as HTMLElement
        target.releasePointerCapture(e.pointerId)

        setIsDragging(true)
        const isSelected = myAvailability.has(slotId)
        const newMode = isSelected ? 'remove' : 'add'
        setDragMode(newMode)
        toggleSlot(slotId, newMode)
        setLastEnteredSlotId(slotId)
    }

    const handlePointerEnter = (e: React.PointerEvent, slotId: string) => {
        if (!isDragging || slotId === lastEnteredSlotId) return

        // Admin Mode Logic
        if (isAdmin && userResponseId === 'admin_mode') {
            if (adminSelection) {
                const newSelection = { ...adminSelection, endSlotId: slotId }
                setAdminSelection(newSelection)
                calculateAdminSelection(newSelection.startSlotId, slotId)
            }
            setLastEnteredSlotId(slotId)
            return
        }

        toggleSlot(slotId, dragMode)
        setLastEnteredSlotId(slotId)
    }

    const handlePointerUp = async () => {
        if (!isDragging) return
        setIsDragging(false)
        setLastEnteredSlotId(null)

        if (isAdmin && userResponseId === 'admin_mode') {
            return
        }

        // Sync to DB (Responder)
        if (userResponseId) {
            await supabase.from('availability').delete().eq('response_id', userResponseId)
            const records = Array.from(myAvailability).map(sid => ({
                response_id: userResponseId,
                time_slot_id: sid
            }))
            if (records.length > 0) {
                await supabase.from('availability').insert(records)
            }
        }
    }

    return (
        <div
            ref={containerRef}
            className="select-none touch-none inline-block min-w-full"
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <div className="flex">
                {/* Time Labels Column */}
                <div className="flex flex-col pt-8 sticky left-0 z-10 bg-white/95 backdrop-blur border-r border-slate-100">
                    {timeLabels.map((time, i) => (
                        <div key={time} className="h-10 flex items-center justify-end pr-2 text-xs font-mono text-slate-400">
                            {time.endsWith(':00') ? time : ''}
                        </div>
                    ))}
                </div>

                {/* Date Columns */}
                {dates.map(date => {
                    const dateObj = parseISO(date)
                    const label = format(dateObj, 'M/d (EEE)', { locale: ja })
                    return (
                        <div key={date} className="flex flex-col flex-1 min-w-[80px]">
                            {/* Header */}
                            <div className="h-8 flex items-center justify-center text-xs font-medium text-slate-600 border-b border-slate-100 sticky top-0 bg-white z-10 whitespace-nowrap">
                                {label}
                            </div>

                            {/* Slots */}
                            {timeLabels.map(time => {
                                const slot = gridData[date][time]
                                if (!slot) return <div key={`${date}-${time}`} className="h-10 bg-slate-50/50" />

                                const isMySelection = myAvailability.has(slot.id)
                                const isAdminSelected = adminSelectedSlots.has(slot.id)

                                const count = heatmapCounts[slot.id] || 0
                                const opacity = totalResponders > 0 ? (count / totalResponders) : 0

                                const cellStyle: React.CSSProperties = {}

                                // Admin Mode Overrides
                                if (isAdminSelected) {
                                    cellStyle.backgroundColor = 'rgba(236, 72, 153, 0.4)' // pink-500/40
                                    cellStyle.border = '1px solid #EC4899'
                                } else if (isMySelection) {
                                    // Me: Solid Green
                                    cellStyle.backgroundColor = '#10B981' // emerald-500
                                } else if (count > 0) {
                                    // Others: Transparent Green
                                    const alpha = Math.max(0.1, opacity * 0.9)
                                    cellStyle.backgroundColor = `rgba(16, 185, 129, ${alpha})`
                                } else {
                                    cellStyle.backgroundColor = 'white'
                                }

                                return (
                                    <div
                                        key={slot.id}
                                        className={cn(
                                            "h-10 border-r border-b border-slate-50 transition-colors duration-75 cursor-pointer relative",
                                            !isMySelection && !isAdminSelected && "hover:bg-slate-50"
                                        )}
                                        style={cellStyle}
                                        title={isAdminSelected ? '確定範囲' : `${count} / ${totalResponders} 人が参加可能`}
                                        onPointerDown={(e) => handlePointerDown(e, slot.id)}
                                        onPointerEnter={(e) => handlePointerEnter(e, slot.id)}
                                    />
                                )
                            })}
                        </div>
                    )
                })}
            </div>

            {/* Show matching percentage for Admin Selection */}
            {adminSelectedSlots.size > 0 && adminSelection && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-pink-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm z-50 animate-in fade-in slide-in-from-bottom-2">
                    選択範囲内の一致率: (計算中...)
                </div>
            )}
        </div>
    )
}
