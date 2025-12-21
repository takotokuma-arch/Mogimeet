import { createClient } from "@/lib/supabase/client"
import { notFound } from "next/navigation"
import { EventView } from "@/components/events/event-view"
import type { Metadata } from 'next'

type Props = {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const resolvedParams = await params
    const id = resolvedParams.id

    // Minimal fetch for metadata
    // Note: real implementation would fetch DB here.
    return {
        title: `日程調整 | MogiMeet`,
    }
}

export default async function EventPage({ params, searchParams }: Props) {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams
    const id = resolvedParams.id
    const adminToken = typeof resolvedSearchParams.token === 'string' ? resolvedSearchParams.token : undefined

    const supabase = createClient()

    // Fetch Event Data
    const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !event) {
        notFound()
    }

    // Fetch Time Slots
    const { data: timeSlots, error: slotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("event_id", id)
        .order("start_at", { ascending: true })

    // Verify Admin Token
    const isAdmin = adminToken === event.admin_token

    return (
        <EventView
            event={event}
            timeSlots={timeSlots || []}
            isAdmin={isAdmin}
            adminToken={isAdmin ? adminToken : undefined}
        />
    )
}
