'use server'

import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { addMinutes, format, parse } from 'date-fns'

export async function createEvent(prevState: any, formData: FormData) {
    const supabase = createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const selectedDatesStr = formData.get('selectedDates') as string
    const slotInterval = parseInt(formData.get('slotInterval') as string || '30')
    const displayStartTime = formData.get('displayStartTime') as string || '09:00'
    const displayEndTime = formData.get('displayEndTime') as string || '23:00'
    const webhookUrl = formData.get('webhookUrl') as string

    if (!title || !selectedDatesStr) {
        return { error: 'Missing required fields' }
    }

    const selectedDates = JSON.parse(selectedDatesStr) as string[] // Expect ISO date strings

    // 1. Create Event
    const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
            title,
            description,
            slot_interval: slotInterval,
            display_start_time: displayStartTime,
            display_end_time: displayEndTime,
            webhook_url: webhookUrl || null,
        })
        .select('id, admin_token')
        .single()

    if (eventError || !event) {
        console.error('Error creating event:', eventError)
        return { error: 'Failed to create event' }
    }

    // 2. Generate Time Slots
    const timeSlots = []

    // Helper to parse time string "09:00" to minutes
    const parseTimeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        return hours * 60 + minutes
    }

    const startMinutes = parseTimeToMinutes(displayStartTime)
    const endMinutes = parseTimeToMinutes(displayEndTime)

    for (const dateStr of selectedDates) {
        const baseDate = new Date(dateStr)
        // We assume the dates selected are essentially "local" days. 
        // We need to construct the timestamp with timezone for the DB.
        // However, the spec says "TIMESTAMPTZ". 
        // For simplicity, we will generate slots for that "day" from start time to end time.
        // We'll iterate from startMinutes to endMinutes.

        let currentMinutes = startMinutes

        // Safety check loop to avoid infinite loops
        while (currentMinutes < endMinutes) {
            // Construct the specific datetime
            const hours = Math.floor(currentMinutes / 60)
            const mins = currentMinutes % 60

            // Create a new date object for this specific slot
            // baseDate is set to 00:00:00 of that day ideally.
            const slotDate = new Date(baseDate)
            slotDate.setHours(hours, mins, 0, 0)

            timeSlots.push({
                event_id: event.id,
                start_at: slotDate.toISOString()
            })

            currentMinutes += slotInterval
        }
    }

    const { error: slotsError } = await supabase
        .from('time_slots')
        .insert(timeSlots)

    if (slotsError) {
        console.error('Error creating slots:', slotsError)
        // Ideally we should rollback the event creation here, but Supabase doesn't support easy transactions via JS client without RPC.
        // For MVP we log error.
        return { error: 'Failed to create time slots' }
    }

    return {
        success: true,
        eventId: event.id,
        adminToken: event.admin_token
    }
}
