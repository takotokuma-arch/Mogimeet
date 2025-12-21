'use server'

import { createClient } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function finalizeEvent(eventId: string, adminToken: string, startSlotId: string, endSlotId: string) {
    const supabase = createClient()

    // 1. Verify Admin Token
    const { data: event } = await supabase.from('events').select('admin_token').eq('id', eventId).single()
    if (!event || event.admin_token !== adminToken) {
        return { error: 'Unauthorized' }
    }

    // 2. Fetch Slots to get Time
    // We need start_at of startSlot and end_at of endSlot (actually start_at + interval)
    // For simplicity, we just store the slot IDs or the timestamps.
    // The DB stores confirmed_start_at / confirmed_end_at as TIMESTAMPTZ.

    // Get start time
    const { data: startSlot } = await supabase.from('time_slots').select('start_at').eq('id', startSlotId).single()
    // Get end time 
    // Note: If user selected multiple slots, the "endSlot" is the start of the last block.
    // We need to add the interval to it. 
    const { data: endSlot } = await supabase.from('time_slots').select('start_at').eq('id', endSlotId).single()
    const { data: evt } = await supabase.from('events').select('slot_interval').eq('id', eventId).single()

    if (!startSlot || !endSlot || !evt) return { error: 'Invalid slots' }

    const startTime = new Date(startSlot.start_at)
    const endTime = new Date(endSlot.start_at)
    // Add interval to end time
    endTime.setMinutes(endTime.getMinutes() + evt.slot_interval)

    // 3. Update Event
    const { error } = await supabase
        .from('events')
        .update({
            confirmed_start_at: startTime.toISOString(),
            confirmed_end_at: endTime.toISOString()
        })
        .eq('id', eventId)

    if (error) return { error: 'Update failed' }

    revalidatePath(`/events/${eventId}`)
    return { success: true }
}
