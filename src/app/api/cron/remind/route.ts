import { createClient } from '@/lib/supabase/client'
import { sendDiscordNotification } from '@/lib/notification'
import { NextResponse } from 'next/server'
import { addHours, subMinutes, addMinutes, isAfter, isBefore } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const supabase = createClient()

    // 1. Fetch upcoming events with deadlines
    // We fetch events where deadline is in the future.
    // Optimization: Filter by close deadlines in DB if possible, but JS filter is safer for logic.
    const now = new Date()
    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .not('deadline_at', 'is', null)
        .not('webhook_url', 'is', null)
        .gt('deadline_at', now.toISOString())

    if (error || !events) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    let sentCount = 0

    for (const event of events) {
        if (!event.webhook_url || !event.reminder_hours) continue

        const deadline = new Date(event.deadline_at)
        const remindTime = subMinutes(deadline, event.reminder_hours * 60) // deadline - reminder_hours

        // Check if NOW is within a 10-minute window of RemindTime
        // We assume cron runs every 10 minutes or so.
        // Window: [remindTime, remindTime + 15m] to allow for slight delays?
        // Actually, if we want to be safe, we check if remindTime is in the past, but not too far in the past.
        // Let's say: remindTime < NOW < remindTime + 20min

        const windowEnd = addMinutes(remindTime, 20)

        if (isAfter(now, remindTime) && isBefore(now, windowEnd)) {
            // Send Reminder
            await sendDiscordNotification(event.webhook_url, 'remind', {
                id: event.id,
                title: event.title,
                admin_token: event.admin_token // We don't expose this in notification usually, but passed for context if needed
            })
            sentCount++
        }
    }

    return NextResponse.json({ success: true, sent: sentCount })
}
