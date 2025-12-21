'use server'

import { createClient } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { sendDiscordNotification } from '@/lib/notification'

export async function finalizeEvent(eventId: string, adminToken: string, startSlotId: string, endSlotId: string) {
    const supabase = createClient()

    // 1. Verify Admin Token & Fetch Settings
    const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single()
    if (!event || event.admin_token !== adminToken) {
        return { error: 'Unauthorized' }
    }

    // 2. Fetch Slots to get Time
    const { data: startSlot } = await supabase.from('time_slots').select('start_at').eq('id', startSlotId).single()
    const { data: endSlot } = await supabase.from('time_slots').select('start_at').eq('id', endSlotId).single()

    // Note: evt is event itself
    if (!startSlot || !endSlot) return { error: 'Invalid slots' }

    const startTime = new Date(startSlot.start_at)
    const endTime = new Date(endSlot.start_at)
    endTime.setMinutes(endTime.getMinutes() + event.slot_interval)

    // 3. Update Event
    const { error } = await supabase
        .from('events')
        .update({
            confirmed_start_at: startTime.toISOString(),
            confirmed_end_at: endTime.toISOString()
        })
        .eq('id', eventId)

    if (error) return { error: 'Update failed' }

    // 4. Send Notification
    const isUpdate = !!event.confirmed_start_at // If it was already confirmed
    const shouldNotify = isUpdate ? event.is_notify_updated : event.is_notify_confirmed

    if (shouldNotify && event.webhook_url) {
        // We pass the Updated event details
        await sendDiscordNotification(event.webhook_url, isUpdate ? 'update' : 'finalize', {
            id: event.id,
            title: event.title,
            description: event.description,
            confirmed_start_at: startTime.toISOString(),
            confirmed_end_at: endTime.toISOString()
        })
    }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}
