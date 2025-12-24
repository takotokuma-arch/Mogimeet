"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner" // Import sonner
// import { useFormStatus } from "react-dom" // We are switching to React Hook Form + Client Submit for easy Zod validation
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon, Loader2, CheckCircle, ArrowRight, Clock, Globe } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

import { createEvent } from "@/app/actions"

// Schema
const formSchema = z.object({
    title: z.string().min(1, "イベント名を入力してください"),
    description: z.string().optional(),
    displayStartTime: z.string(),
    displayEndTime: z.string(),
    timezone: z.string().default(Intl.DateTimeFormat().resolvedOptions().timeZone), // Default to user's system timezone
    webhookUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
    reminderHours: z.string().optional(),
})

export function CreateEventForm() {
    const router = useRouter()
    const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([])
    const [slotInterval, setSlotInterval] = useState("30")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [result, setResult] = useState<{ success?: boolean; error?: string; eventId?: string; adminToken?: string } | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    // Get system timezone for default
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue, // We need setValue for Select
        watch,
    } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            displayStartTime: "09:00",
            displayEndTime: "23:00",
            timezone: systemTimezone,
            webhookUrl: "",
            reminderHours: "3", // Default to 3 hours
        },
    })

    // Submit Handler
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        if (!selectedDates || selectedDates.length === 0) {
            toast.error("日付を選択してください", {
                description: "少なくとも1つの候補日が必要です"
            })
            return
        }

        setIsSubmitting(true)

        // Prepare FormData
        const formData = new FormData()
        formData.append('title', data.title)
        if (data.description) formData.append('description', data.description)
        formData.append('displayStartTime', data.displayStartTime)
        formData.append('displayEndTime', data.displayEndTime)
        formData.append('slotInterval', slotInterval)
        formData.append('timezone', data.timezone)
        if (data.webhookUrl) formData.append('webhookUrl', data.webhookUrl)
        formData.append('reminder_hours', data.reminderHours || '0')
        formData.append('selectedDates', JSON.stringify(selectedDates.map(d => format(d, 'yyyy-MM-dd'))))

        try {
            const res = await createEvent(null, formData)
            setResult(res)
            if (res.success) {
                setIsOpen(true)
                toast.success("イベントを作成しました！")
            } else if (res.error) {
                toast.error("エラーが発生しました", { description: res.error })
            }
        } catch (e) {
            toast.error("不明なエラーが発生しました")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Time Options
    const timeOptions = []
    for (let i = 0; i < 24; i++) {
        timeOptions.push(`${i.toString().padStart(2, '0')}:00`)
        timeOptions.push(`${i.toString().padStart(2, '0')}:30`)
    }
    const endTimeOptions = [...timeOptions]

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* Section 1: Basic Info */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle>イベントの基本情報</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-base font-bold text-slate-800">
                                イベント名 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="例：年越し鍋パーティー"
                                className={cn("text-lg py-6", errors.title && "border-red-500 focus-visible:ring-red-500")}
                                {...register("title")}
                            />
                            {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-slate-700">説明（任意）</Label>
                            <Textarea
                                id="description"
                                placeholder="場所、会費、持ち物などを記入できます。"
                                className="min-h-[100px] bg-slate-50/50 text-slate-800"
                                {...register("description")}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Section 2: Date Selection */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                        <div className="flex flex-row items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">候補日</CardTitle>
                                <CardDescription>カレンダーをタップして選択（複数可）</CardDescription>
                            </div>
                        </div>

                        {/* Timezone Selector */}
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 text-sm md:ml-auto">
                            <Globe className="h-4 w-4 text-slate-400" />
                            <Select
                                defaultValue={systemTimezone}
                                onValueChange={(val) => {
                                    setValue('timezone', val)
                                }}
                            >
                                <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 w-[180px] text-xs font-medium text-slate-600">
                                    <SelectValue placeholder="タイムゾーン" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {Intl.supportedValuesOf('timeZone').map((tz) => (
                                        <SelectItem key={tz} value={tz} className="text-xs">
                                            {tz.replace(/_/g, " ")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input type="hidden" {...register("timezone")} />
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center pt-4">
                        <div className="p-4 bg-white rounded-xl border shadow-sm">
                            <Calendar
                                mode="multiple"
                                selected={selectedDates}
                                onSelect={setSelectedDates}

                                className="rounded-md"
                            />
                        </div>
                        {selectedDates && selectedDates.length > 0 && (
                            <div className="w-full mt-6 space-y-2 animate-in fade-in slide-in-from-top-1">
                                <Label className="text-xs text-slate-600">選択中の日付 ({selectedDates.length})</Label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedDates.slice(0, 15).map((date, i) => (
                                        <span key={i} className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold shadow-sm border border-emerald-200">
                                            {format(date, "MM/dd (EEE)", { locale: ja })}
                                        </span>
                                    ))}
                                    {(selectedDates.length > 15) && (
                                        <span className="text-xs text-slate-500 self-center pl-2">他 {selectedDates.length - 15} 日...</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Section 3: Time Settings */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center space-y-0 gap-3 pb-2">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">時間設定</CardTitle>
                            <CardDescription>候補時間の範囲と刻みを設定します</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">

                        {/* Slot Interval Unified Toggle */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-slate-800">時間刻み</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {['15', '30', '60'].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setSlotInterval(val)}
                                        className={cn(
                                            "py-3 text-sm font-bold rounded-xl border transition-all duration-200",
                                            slotInterval === val
                                                ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-[1.02]"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                        )}
                                    >
                                        {val}分
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Range */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-slate-800">時間の範囲</Label>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                    {/* Controller for Start Time */}
                                    <div className="relative">
                                        <Select
                                            defaultValue="09:00"
                                            onValueChange={(val) => {
                                                // We can just use setValue if we destructured it, or better:
                                                // RHF doesn't expose setValue in the destructure above properly yet.
                                                // Let's rely on standard FormData submission OR simple state.
                                                // For this quick fix, I will use a hidden input that binds to Register, 
                                                // and update it manually via ref or event.
                                                // ACTUALLY, simpler: RHF's Controller is best.
                                                // But to avoid imports mess, let's use the pattern:
                                                const hidden = document.getElementById('hidden-start-time') as HTMLInputElement;
                                                if (hidden) {
                                                    hidden.value = val;
                                                    hidden.dispatchEvent(new Event('input', { bubbles: true })); // Trigger RHF
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-12 text-base">
                                                <SelectValue placeholder="開始" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {timeOptions.map(t => (
                                                    <SelectItem key={`start-${t}`} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <input
                                            type="hidden"
                                            id="hidden-start-time"
                                            {...register("displayStartTime")}
                                            defaultValue="09:00"
                                        />
                                    </div>
                                </div>

                                <div className="text-slate-500">
                                    <ArrowRight className="h-5 w-5" />
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="relative">
                                        <Select
                                            defaultValue="23:00"
                                            onValueChange={(val) => {
                                                const hidden = document.getElementById('hidden-end-time') as HTMLInputElement;
                                                if (hidden) {
                                                    hidden.value = val;
                                                    hidden.dispatchEvent(new Event('input', { bubbles: true }));
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-12 text-base">
                                                <SelectValue placeholder="終了" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {endTimeOptions.map(t => (
                                                    <SelectItem key={`end-${t}`} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <input
                                            type="hidden"
                                            id="hidden-end-time"
                                            {...register("displayEndTime")}
                                            defaultValue="23:00"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 4: Advanced (Accordion) */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="options" className="border-b-0">
                        <AccordionTrigger className="text-slate-600 hover:text-slate-800 hover:no-underline px-1">
                            詳細設定（Webhookなど）
                        </AccordionTrigger>
                        <AccordionContent className="px-1">
                            <Card className="bg-slate-50 border border-slate-100 shadow-inner">
                                <CardContent className="pt-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="webhookUrl" className="text-slate-700 font-medium">Discord Webhook URL</Label>
                                        <Input
                                            id="webhookUrl"
                                            placeholder="https://discord.com/api/webhooks/..."
                                            className="bg-white"
                                            {...register("webhookUrl")}
                                        />
                                        <p className="text-[10px] text-slate-500">
                                            イベント作成時や日程決定時に通知が送信されます。
                                        </p>
                                    </div>

                                    <div className="space-y-3 mt-6">
                                        <Label htmlFor="reminderHours" className="text-slate-700 font-medium">リマインド設定</Label>
                                        <div className="flex flex-col gap-2">
                                            <Select
                                                defaultValue="3"
                                                onValueChange={(val) => setValue('reminderHours', val)}
                                            >
                                                <SelectTrigger className="w-full bg-white">
                                                    <SelectValue placeholder="リマインド時間を選択" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">なし</SelectItem>
                                                    <SelectItem value="1">1時間前</SelectItem>
                                                    <SelectItem value="3">3時間前</SelectItem>
                                                    <SelectItem value="12">12時間前</SelectItem>
                                                    <SelectItem value="24">24時間前（前日）</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <input type="hidden" {...register("reminderHours")} />
                                            <p className="text-[10px] text-slate-500">
                                                指定した時間の前に、Discordで通知を受け取れます（Webhook設定必須）。
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 text-lg font-bold shadow-lg bg-slate-900 hover:bg-slate-800 transition-all rounded-xl"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            作成中...
                        </>
                    ) : (
                        "イベントを作成する"
                    )}
                </Button>
            </form >

            {/* Success Modal */}
            < Dialog open={isOpen} onOpenChange={(open) => {
                if (!open) { /* Do nothing or redirect? */ }
                setIsOpen(open)
            }
            }>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto bg-emerald-100 p-3 rounded-full w-fit mb-4">
                            <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <DialogTitle className="text-center text-xl font-bold">イベントを作成しました！</DialogTitle>
                        <DialogDescription className="text-center">
                            以下のURLをメンバーに共有してください。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">参加者用 URL</Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    readOnly
                                    value={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${result?.eventId}`}
                                    className="bg-slate-50 font-mono text-xs h-10"
                                />
                                <Button size="sm" variant="outline" className="h-10 px-4" onClick={() => {
                                    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${result?.eventId}`)
                                    toast.success("URLをコピーしました")
                                }}>
                                    コピー
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 p-3 bg-pink-50 rounded-lg border border-pink-100">
                            <Label className="text-xs font-bold text-pink-600 uppercase tracking-wider flex items-center gap-2">
                                管理者用 URL <span className="bg-pink-200 text-pink-700 text-[9px] px-1.5 py-0.5 rounded">重要</span>
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    readOnly
                                    value={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${result?.eventId}?token=${result?.adminToken}`}
                                    className="bg-white border-pink-200 font-mono text-xs text-pink-700 font-bold h-10"
                                />
                                <Button size="sm" variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-100 h-10 px-4" onClick={() => {
                                    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${result?.eventId}?token=${result?.adminToken}`)
                                    toast.success("管理者用URLをコピーしました", { description: "紛失しないようご注意ください" })
                                }}>
                                    コピー
                                </Button>
                            </div>
                            <p className="text-[10px] text-pink-600 mt-1">日程の最終決定に必要です。必ず保存してください。</p>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-center gap-2">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => window.location.href = `/events/${result?.eventId}?token=${result?.adminToken}`}>
                            イベントページへ移動
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </>
    )
}
