"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">About</h1>
        </div>

        <Card className="border-0 shadow-lg dark:bg-slate-800/50">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Tempted AI</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Version 2.5.0</p>
            </div>
            <Separator />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              An AI-powered creative suite for generating images, videos, text, music, and more.
            </p>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Features</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>AI Image Generation</li>
                <li>Video Creation</li>
                <li>Text Generation</li>
                <li>Face Swap Technology</li>
                <li>Image Editing Tools</li>
                <li>Music Browser</li>
                <li>Content Library</li>
              </ul>
            </div>
            <Separator />
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>Updates automatically check every hour</p>
              <p>Clear cache in Storage settings if updates don&apos;t appear</p>
            </div>
            <Separator />
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <p>Built with Next.js and Supabase</p>
              <p className="mt-1">&copy; 2024 Tempted AI. All rights reserved.</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open('https://github.com', '_blank')}
          >
            View on GitHub
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open('https://github.com', '_blank')}
          >
            Report an Issue
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open('https://github.com', '_blank')}
          >
            Privacy Policy
          </Button>
        </div>
      </div>
    </main>
  )
}
