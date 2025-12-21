"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { X, Save, MessageSquare, Bell, Calendar, Lock } from "lucide-react"
import { updateEventSettings, testDiscordWebhook } from "@/app/actions"
import { useRouter } from "next/navigation"

type AdminPanelProps = {
    event: any
    adminToken: string
    onClose: () => void
}

export function AdminPanel({ event, adminToken, onClose }: AdminPanelProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
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
