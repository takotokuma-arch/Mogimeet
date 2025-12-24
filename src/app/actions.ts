import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { addMinutes, format, parse } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

export async function createEvent(prevState: any, formData: FormData) {
    const supabase = createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const selectedDatesStr = formData.get('selectedDates') as string
    const slotInterval = parseInt(formData.get('slotInterval') as string || '30')
    const displayStartTime = formData.get('displayStartTime') as string || '09:00'
    const displayEndTime = formData.get('displayEndTime') as string || '23:00'
    const timezone = formData.get('timezone') as string || 'UTC'
    const webhookUrl = formData.get('webhookUrl') as string
    const reminderHoursStr = formData.get('reminder_hours') as string
    const reminderHours = (reminderHoursStr && reminderHoursStr !== '0') ? parseInt(reminderHoursStr) : null

    if (!title || !selectedDatesStr) {
        return { error: 'Missing required fields' }
    }

    const selectedDates = JSON.parse(selectedDatesStr) as string[] // Expect YYYY-MM-DD strings

    // 1. Create Event
    let eventData;
    let eventError;

    // Try inserting with timezone
    const res = await supabase
        .from('events')
        .insert({
            title,
            description,
            slot_interval: slotInterval,
            display_start_time: displayStartTime,
            display_end_time: displayEndTime,
            timezone, // Save the timezone!
            webhook_url: webhookUrl || null,
            reminder_hours: reminderHours,
        })
        .select('id, admin_token')
        .single()

    eventData = res.data;
    eventError = res.error;

    // Fallback: If timezone column is missing (code 42703 or schema cache error), try inserting without it
    if (eventError && (eventError.code === '42703' || eventError.message?.includes('Could not find the') || eventError.message?.includes('timezone'))) {
        console.warn('Timezone column missing or schema cache stale. Falling back to legacy insert.');
        const fallbackRes = await supabase
            .from('events')
            .insert({
                title,
                description,
                slot_interval: slotInterval,
                display_start_time: displayStartTime,
                display_end_time: displayEndTime,
                // timezone omitted
                webhook_url: webhookUrl || null,
                reminder_hours: reminderHours,
            })
            .select('id, admin_token')
            .single();

        eventData = fallbackRes.data;
        eventError = fallbackRes.error;
    }

    if (eventError || !eventData) {
        console.error('Error creating event:', JSON.stringify(eventError, null, 2))
        return { error: 'Failed to create event' }
    }

    const event = eventData;

    // 2. Generate Time Slots
    const timeSlots = []

    for (const dateStr of selectedDates) {
        // Construct start and end times for this date in the target timezone
        const startDateTimeStr = `${dateStr} ${displayStartTime}`
        const endDateTimeStr = `${dateStr} ${displayEndTime}`

        // Convert to UTC Date objects
        const startAt = fromZonedTime(startDateTimeStr, timezone)
        let endAt = fromZonedTime(endDateTimeStr, timezone)

        // Handle case where end time is simpler or wraps? 
        // For simplicity, we assume same-day range like "09:00" to "23:00".
        // If "end" is smaller than "start" (e.g. 23:00 to 02:00), we probably should handle next day?
        // Current requirement implies simple day ranges. 
        if (endAt <= startAt) {
            // If end time is same or before start, maybe user meant next day? 
            // But simpler to just skip or assume same day end. 
            // Let's assume strict same-day range for now.
        }

        let current = startAt
        while (current < endAt) {
            timeSlots.push({
                event_id: event.id,
                start_at: current.toISOString()
            })
            current = addMinutes(current, slotInterval)
        }
    }

    const { error: slotsError } = await supabase
        .from('time_slots')
        .insert(timeSlots)

    if (slotsError) {
        console.error('Error creating slots:', slotsError)
        return { error: 'Failed to create time slots' }
    }

    return {
        success: true,
        eventId: event.id,
        adminToken: event.admin_token
    }
}

export async function updateEventSettings(
    eventId: string,
    adminToken: string,
    data: {
        title?: string
        description?: string
        webhookUrl?: string
        isNotifyConfirmed?: boolean
        isNotifyUpdated?: boolean
        reminderHours?: number
    }
) {
    const supabase = createClient()

    // Verify Admin
    const { data: event } = await supabase.from('events').select('admin_token').eq('id', eventId).single()
    if (!event || event.admin_token !== adminToken) {
        return { error: 'Unauthorized' }
    }

    const updates: any = {}
    if (data.title !== undefined) updates.title = data.title
    if (data.description !== undefined) updates.description = data.description
    if (data.webhookUrl !== undefined) updates.webhook_url = data.webhookUrl
    if (data.isNotifyConfirmed !== undefined) updates.is_notify_confirmed = data.isNotifyConfirmed
    if (data.isNotifyUpdated !== undefined) updates.is_notify_updated = data.isNotifyUpdated
    if (data.reminderHours !== undefined) updates.reminder_hours = data.reminderHours

    const { error } = await supabase.from('events').update(updates).eq('id', eventId)

    if (error) return { error: 'Update failed' }
    return { success: true }
}

import { sendDiscordNotification } from '@/lib/notification'

export async function testDiscordWebhook(url: string) {
    if (!url) return { error: 'No URL provided' }
    try {
        await sendDiscordNotification(url, 'create', {
            id: 'test',
            title: 'Webhook Test',
            description: 'This is a test notification from MogiMeet.'
        })
        return { success: true }
    } catch (e) {
        return { error: 'Failed to send' }
    }
}
