import { CreateEventForm } from "@/components/events/create-event-form"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "イベント作成 | MogiMeet",
    description: "新しいイベントを作成して調整を開始しましょう。",
}

export default function CreatePage() {
    return (
        <div className="min-h-screen bg-white">
            <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-2xl">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                        MogiMeet
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
                <div className="mb-8 text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">新しいイベントを作成</h1>
                    <p className="text-slate-500">候補日を選んで URL を共有するだけ。</p>
                </div>

                <CreateEventForm />
            </main>
        </div>
    )
}
