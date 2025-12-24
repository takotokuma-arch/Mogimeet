import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--lm-bg-cream)]">
      <header className="sticky top-0 z-50 w-full bg-[var(--lm-bg-cream)]/80 backdrop-blur-md border-b border-transparent">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight text-[var(--lm-green-light)]">
            MogiMeet
            <div className="h-2 w-2 rounded-full bg-[var(--lm-green-light)]" />
          </div>
          <Link href="/create">
            <Button className="rounded-full bg-[var(--lm-green-light)] hover:bg-[var(--lm-green-dark)] text-white font-bold px-6 shadow-md transition-all hover:scale-105">
              イベントをつくる
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-10 container mx-auto mt-10">
        <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--lm-text-dark)] leading-tight">
            スイスイ調整、<br className="md:hidden" />
            パッと決定。
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 font-medium">
            ログイン不要、アプリ不要。<br />
            URLを共有するだけで、全員の予定がヒートマップで可視化されます。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 animate-in fade-in slide-in-from-bottom-5 delay-150 duration-700">
          <Link href="/create">
            <Button size="lg" className="text-xl font-bold px-10 h-16 rounded-full shadow-xl bg-[var(--lm-green-light)] hover:bg-[var(--lm-green-dark)] transition-all hover:-translate-y-1">
              無料で始める
            </Button>
          </Link>
        </div>

        <div className="mt-16 w-full max-w-5xl border-0 shadow-2xl rounded-3xl overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-6 delay-300 duration-1000">
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
