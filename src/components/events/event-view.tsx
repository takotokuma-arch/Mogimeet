"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { TimeGrid } from "@/components/events/grid/time-grid"
import { Users, Link as LinkIcon, Check, Settings } from "lucide-react"
import { finalizeEvent } from "@/app/finalize-actions"
import { useRouter } from "next/navigation"
import { AdminPanel } from "@/components/events/admin-panel"

// Types (should be in a types file, but keeping here for speed for now)
type Event = {
    id: string
    title: string
    description: string
    slot_interval: number
    confirmed_start_at: string | null
    confirmed_end_at: string | null
    webhook_url?: string | null
    is_notify_confirmed?: boolean
    is_notify_updated?: boolean
    reminder_hours?: number
}

type TimeSlot = {
    id: string
    start_at: string
}

interface EventViewProps {
    event: Event
    timeSlots: TimeSlot[]
    isAdmin: boolean
    adminToken?: string
}

export function EventView({ event, timeSlots, isAdmin, adminToken }: EventViewProps) {
    const [isCheckInOpen, setIsCheckInOpen] = useState(false)
    const [userName, setUserName] = useState("")
    const [currentUser, setCurrentUser] = useState<{ id: string, name: string } | null>(null)

    // Admin State
    const [adminMode, setAdminMode] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [adminSelectionRaw, setAdminSelectionRaw] = useState<{ start: string, end: string } | null>(null)

    const router = useRouter()

    // Initial Check-in Logic
    useEffect(() => {
        const storedId = localStorage.getItem(`mogimeet_response_${event.id}`)
        const storedName = localStorage.getItem(`mogimeet_name_${event.id}`)

        if (storedId && storedName) {
            setCurrentUser({ id: storedId, name: storedName })
        } else {
            // If admin, maybe auto-login as admin? For now, ask name strictly.
            setIsCheckInOpen(true)
        }
    }, [event.id])

    // Handle Check-in Submit
    const handleCheckIn = async () => {
        if (!userName.trim()) return

        const supabase = createClient()

        // Generate a fingerprint (simple random for now, could be better)
        const fingerprint = Math.random().toString(36).substring(2) + Date.now().toString(36)

        const { data: response, error } = await supabase
            .from('responses')
            .insert({
                event_id: event.id,
                user_name: userName,
                user_fingerprint: fingerprint,
                is_admin: isAdmin // If they possess the token URL, mark as admin responder
            })
            .select()
            .single()

        if (response) {
            localStorage.setItem(`mogimeet_response_${event.id}`, response.id)
            localStorage.setItem(`mogimeet_name_${event.id}`, userName)
            setCurrentUser({ id: response.id, name: userName })
            setIsCheckInOpen(false)
        }
    }

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* Sidebar (Desktop) */}
            <aside className="w-64 border-r border-slate-200 bg-slate-50 hidden md:flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <h1 className="font-bold text-lg leading-tight truncate">{event.title}</h1>
                    <p className="text-xs text-slate-500 mt-1 truncate">{event.description}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Participants</h3>
                        <div className="space-y-2">
                            {/* Placeholder List */}
                            {currentUser && (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-900 text-sm font-medium">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    {currentUser.name} (You)
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200">
                    <Button variant="outline" className="w-full text-xs" onClick={() => navigator.clipboard.writeText(window.location.href.split('?')[0])}>
                        <LinkIcon className="mr-2 h-3 w-3" /> URLをコピー
                    </Button>
                </div>
            </aside>

            {/* Main Grid Area */}
            <main className="flex-1 flex flex-col h-full relative">
                {/* Header */}
                <header className="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-white/80 backdrop-blur shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-semibold truncate">{event.title}</span>
                        {event.confirmed_start_at && (
                            <span className="bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                                決定済み
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <Button
                                size="sm"
                                variant={adminMode ? "default" : "outline"}
                                className={cn(adminMode && "bg-pink-600 hover:bg-pink-700 border-pink-600 text-white")}
                                onClick={() => setAdminMode(!adminMode)}
                            >
                                {adminMode ? "調整モード終了" : "日程を決定する"}
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" className="md:hidden">
                            <Users className="h-5 w-5" />
                        </Button>
                        {isAdmin && (
                            <Button size="sm" variant="ghost" onClick={() => setShowSettings(true)}>
                                <Settings className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </header>

                {/* Admin Finalize Bar */}
                {adminMode && (
                    <div className="bg-pink-50 border-b border-pink-200 p-2 flex items-center justify-between px-4 animate-in slide-in-from-top-2">
                        <div className="text-xs text-pink-800 font-medium">
                            ドラッグして開催日時を決定してください
                        </div>
                    </div>
                )}

                {/* Scrollable Grid Container */}
                <div className="flex-1 overflow-auto p-4 relative" style={{ touchAction: 'none' }}>
                    <TimeGrid
                        timeSlots={timeSlots}
                        userResponseId={adminMode ? 'admin_mode' : (currentUser?.id || null)}
                        isAdmin={isAdmin}
                        eventId={event.id}
                        onAdminSelect={(s, e) => setAdminSelectionRaw({ start: s, end: e })}
                    />
                </div>

                {/* Confirmed Banner */}
                {event.confirmed_start_at && (
                    <div className="mx-4 mt-4 p-4 bg-white border-2 border-emerald-500 rounded-xl shadow-sm text-center space-y-2 animate-in slide-in-from-top-4">
                        <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-lg">
                            <Check className="h-6 w-6" />
                            <span>日程が決定しました！</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 inline-block w-full">
                            <div className="font-bold text-2xl text-slate-800">
                                {event.confirmed_start_at && new Date(event.confirmed_start_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}
                            </div>
                            <div className="text-lg text-slate-600 font-mono">
                                {event.confirmed_start_at && new Date(event.confirmed_start_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {event.confirmed_end_at && new Date(event.confirmed_end_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Finalize Button */}
                {adminMode && adminSelectionRaw && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                        <Button
                            size="lg"
                            className="shadow-xl bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-full px-8 animate-in zoom-in"
                            onClick={async () => {
                                if (!confirm("この日時で決定しますか？\n(参加者には通知されませんが、管理者トークンページで確認できます)")) return
                                if (!adminToken) return
                                const res = await finalizeEvent(event.id, adminToken, adminSelectionRaw.start, adminSelectionRaw.end)
                                if (res.success) {
                                    alert("日程を決定しました！")
                                    setAdminMode(false)
                                    router.refresh()
                                } else {
                                    alert("エラーが発生しました")
                                }
                            }}
                        >
                            <Check className="mr-2 h-4 w-4" /> 決定する
                        </Button>
                    </div>
                )}
            </main>

            {/* Check-in Modal */}
            <Dialog open={isCheckInOpen} onOpenChange={(open) => { if (currentUser) setIsCheckInOpen(open) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>ようこそ！</DialogTitle>
                        <DialogDescription>
                            回答を始めるために、お名前を入力してください。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">お名前</Label>
                            <Input
                                id="username"
                                placeholder="例：佐藤"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="text-lg"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCheckIn} disabled={!userName.trim()} className="w-full">
                            回答を始める
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Admin Panel */}
            {showSettings && isAdmin && adminToken && (
                <AdminPanel
                    event={event}
                    adminToken={adminToken}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    )
}
