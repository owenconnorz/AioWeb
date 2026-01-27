"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SupportedLinksPage() {
  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Open Supported Links</h1>
        </div>

        <Card className="border-0 shadow-lg bg-slate-800/50">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Supported Links</h3>
              <p className="text-sm text-slate-400">Configure how external links are handled</p>
            </div>
            <Separator className="bg-slate-700" />
            <p className="text-sm text-slate-300">
              Configure which types of links the app should open automatically. This includes
              deep links, web URLs, and other supported protocols.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
