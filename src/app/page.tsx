import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            MogiMeet
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <Link href="/create">
            <Button>イベントをつくる</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-8 container mx-auto">
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-slate-900">
            スイスイ調整、<br className="md:hidden" />
            パッと決定。
          </h1>
          <p className="text-lg md:text-xl text-slate-500">
            ログイン不要、アプリ不要。<br />
            URLを共有するだけで、全員の予定がヒートマップで可視化されます。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/create">
            <Button size="lg" className="text-lg px-8 h-12 rounded-full shadow-lg hover:shadow-xl transition-all">
              無料で始める
            </Button>
          </Link>
        </div>

        <div className="mt-12 w-full max-w-4xl border rounded-2xl shadow-2xl overflow-hidden bg-slate-50">
          {/* Placeholder for a demo image or simplified grid view */}
          <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-400">
            (Demo Image / UI Implementation Preview)
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-slate-100 text-center text-slate-400 text-sm">
        &copy; 2025 MogiMeet. All rights reserved.
      </footer>
    </div>
  )
}
