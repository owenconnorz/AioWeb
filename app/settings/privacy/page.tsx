"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Privacy</h1>
        </div>

        <Card className="border-0 shadow-lg bg-slate-800/50">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Privacy Settings</h3>
              <p className="text-sm text-slate-400">Manage your privacy preferences</p>
            </div>
            <Separator className="bg-slate-700" />
            <p className="text-sm text-slate-300">
              Privacy settings coming soon. This section will allow you to control data collection,
              analytics, and other privacy-related features.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
