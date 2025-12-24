"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { X, Save, MessageSquare, Bell, Calendar, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateEventSettings, testDiscordWebhook } from "@/app/actions"
import { finalizeEvent } from "@/app/finalize-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner" // Import sonner

type AdminPanelProps = {
    event: any
    adminToken: string
    onClose: () => void
    isScheduleMode: boolean
    onToggleScheduleMode: (val: boolean) => void
    currentSelection: { start: string, end: string } | null
}

export function AdminPanel({ event, adminToken, onClose, isScheduleMode, onToggleScheduleMode, currentSelection }: AdminPanelProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [finalizing, setFinalizing] = useState(false) // For finalize button
    const [formData, setFormData] = useState({
        title: event.title,
        description: event.description || "",
        webhookUrl: event.webhook_url || "",
        isNotifyConfirmed: event.is_notify_confirmed ?? true,
        isNotifyUpdated: event.is_notify_updated ?? true,
        reminderHours: event.reminder_hours || 24,
    })

    const handleSave = async () => {
        setLoading(true)
        const res = await updateEventSettings(event.id, adminToken, {
            title: formData.title,
            description: formData.description,
            webhookUrl: formData.webhookUrl,
            isNotifyConfirmed: formData.isNotifyConfirmed,
            isNotifyUpdated: formData.isNotifyUpdated,
            reminderHours: parseInt(formData.reminderHours.toString()),
        })
        setLoading(false)

        if (res.success) {
            alert("設定を保存しました")
            router.refresh()
        } else {
            alert("保存に失敗しました")
        }
    }

    const handleTestWebhook = async () => {
        if (!formData.webhookUrl) return
        const res = await testDiscordWebhook(formData.webhookUrl)
        if (res.success) alert("テスト送信しました")
        else alert("送信に失敗しました")
    }

    const handleFinalize = async () => {
        if (!currentSelection) return
        if (!confirm("この日時で決定しますか？\n(参加者には通知されませんが、管理者トークンページで確認できます)")) return

        setFinalizing(true)
        const res = await finalizeEvent(event.id, adminToken, currentSelection.start, currentSelection.end)
        setFinalizing(false)

        if (res.success) {
            toast.success("日程を決定しました！", { description: "参加者に通知が送信されます" })
            onToggleScheduleMode(false)
            router.refresh()
            onClose()
        } else {
            toast.error("エラーが発生しました")
        }
    }

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 z-50 overflow-y-auto transform transition-transform duration-300">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 sticky top-0 backdrop-blur">
                <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-pink-500" />
                    <h2 className="font-bold text-slate-800">管理者設定</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <div className="p-4 space-y-6">
                {/* Schedule Mode Section */}
                <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-pink-700 font-bold text-sm">
                            <Calendar className="h-4 w-4" />
                            日程調整モード
                        </div>
                        <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 bg-slate-200 data-[state=checked]:bg-pink-500"
                            role="switch"
                            data-state={isScheduleMode ? 'checked' : 'unchecked'}
                            onClick={() => onToggleScheduleMode(!isScheduleMode)}
                        >
                            <span
                                className={cn("pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out", isScheduleMode ? "translate-x-5" : "translate-x-0")}
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-pink-600/80">
                        有効にするとグリッドがピンク色になり、ドラッグして開催日時を選択できます。
                    </p>

                    {/* Finalize Action */}
                    {isScheduleMode && (
                        <div className="pt-2 border-t border-pink-200 mt-2">
                            {currentSelection ? (
                                <div className="space-y-2">
                                    <div className="text-xs text-center font-bold text-pink-800">
                                        選択中: {currentSelection.start.slice(0, 5)}...
                                    </div>
                                    <Button
                                        onClick={handleFinalize}
                                        disabled={finalizing}
                                        className="w-full bg-pink-600 hover:bg-pink-700 text-white shadow-md border-pink-700"
                                    >
                                        {finalizing ? "処理中..." : "この日程で確定する"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-[10px] text-center text-pink-400 py-1">
                                    グリッドをドラッグして範囲を選択してください
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Basic Info */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">イベント情報</h3>
                    <div className="space-y-2">
                        <Label>イベント名</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>説明</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-[80px]"
                        />
                    </div>
                </div>

                {/* Discord Settings */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" /> Discord連携
                    </h3>
                    <div className="space-y-2">
                        <Label>Webhook URL</Label>
                        <div className="flex gap-2">
                            <Input
                                value={formData.webhookUrl}
                                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                                placeholder="https://discord.com/api/webhooks/..."
                                className="text-xs font-mono"
                            />
                            <Button variant="outline" size="sm" onClick={handleTestWebhook} disabled={!formData.webhookUrl}>
                                テスト
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isNotifyConfirmed}
                                onChange={(e) => setFormData({ ...formData, isNotifyConfirmed: e.target.checked })}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>日程確定時に通知する</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isNotifyUpdated}
                                onChange={(e) => setFormData({ ...formData, isNotifyUpdated: e.target.checked })}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>日程変更時に通知する</span>
                        </label>
                    </div>
                </div>

                {/* Automation */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Bell className="h-3 w-3" /> リマインド設定
                    </h3>
                    <div className="space-y-2">
                        <Label>何時間前に通知する？</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={formData.reminderHours}
                                onChange={(e) => setFormData({ ...formData, reminderHours: parseInt(e.target.value) })}
                                className="w-20"
                            />
                            <span className="text-sm text-slate-500">時間前（未確定の回答者へ）</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                            ※ 回答締め切り日時が設定されている場合のみ有効です。
                        </p>
                    </div>
                </div>

                <div className="pt-4 pb-20">
                    <Button onClick={handleSave} disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                        {loading ? "保存中..." : "設定を保存"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
