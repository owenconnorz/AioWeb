"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Library, HardDrive, Palette, Layout, Play, RotateCcw, Database, FlaskConical, Info, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const CategoryButton = ({
    icon: Icon,
    title,
    href
  }: {
    icon: any
    title: string
    href: string
  }) => (
    <Link
      href={href}
      className="flex items-center gap-4 w-full p-4 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-lg border-0 shadow-sm"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700">
        <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
      </div>
      <span className="flex-1 text-left text-base font-medium text-slate-900 dark:text-slate-100">{title}</span>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </Link>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <CategoryButton
              icon={User}
              title="Account and sync"
              href="/settings/account-and-sync"
            />
            <CategoryButton
              icon={Library}
              title="Library and content"
              href="/settings/library-and-content"
            />
            <CategoryButton
              icon={HardDrive}
              title="Local media"
              href="/settings/local-media"
            />
          </div>

          <div className="space-y-2">
            <CategoryButton
              icon={Palette}
              title="Appearance"
              href="/settings/appearance"
            />
            <CategoryButton
              icon={Layout}
              title="Interface"
              href="/settings/interface"
            />
          </div>

          <div className="space-y-2">
            <CategoryButton
              icon={Play}
              title="Player and audio"
              href="/settings/player-and-audio"
            />
          </div>

          <div className="space-y-2">
            <CategoryButton
              icon={RotateCcw}
              title="Backup and restore"
              href="/settings/backup-and-restore"
            />
            <CategoryButton
              icon={Database}
              title="Storage"
              href="/settings/storage"
            />
          </div>

          <div className="space-y-2">
            <CategoryButton
              icon={FlaskConical}
              title="Experimental"
              href="/settings/experimental"
            />
          </div>

          <div className="space-y-2">
            <CategoryButton
              icon={Info}
              title="About"
              href="/settings/about"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
