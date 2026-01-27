"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Palette, Play, Globe, Shield, Database, RotateCcw, Link2, RefreshCw, Info, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"

export default function SettingsPage() {
  const router = useRouter()
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)

  const CategoryButton = ({
    icon: Icon,
    title,
    href,
    onClick
  }: {
    icon: any
    title: string
    href?: string
    onClick?: () => void
  }) => {
    const handleClick = () => {
      if (onClick) {
        onClick()
      } else if (href) {
        router.push(href)
      }
    }

    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-4 w-full p-4 bg-slate-800/30 hover:bg-slate-700/30 transition-colors rounded-xl border-0"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20">
          <Icon className="h-5 w-5 text-blue-400" />
        </div>
        <span className="flex-1 text-left text-base font-medium text-white">{title}</span>
        <ChevronRight className="h-5 w-5 text-slate-400" />
      </button>
    )
  }

  const SectionHeader = ({ title }: { title: string }) => (
    <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3 px-1">{title}</h2>
  )

  const checkForUpdates = async () => {
    setIsCheckingUpdate(true)
    toast.info("Checking for updates...")

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()

        if (registration) {
          await registration.update()

          if (registration.waiting) {
            toast.success("Update available! Installing...", {
              description: "The app will reload shortly"
            })

            registration.waiting.postMessage({ type: 'SKIP_WAITING' })

            setTimeout(() => {
              window.location.reload()
            }, 1000)
          } else {
            toast.success("You're up to date!", {
              description: "Running the latest version"
            })
          }
        } else {
          toast.info("Service worker not registered", {
            description: "Updates will be checked automatically"
          })
        }
      } else {
        toast.error("Updates not supported", {
          description: "Your browser doesn't support service workers"
        })
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
      toast.error("Failed to check for updates", {
        description: "Please try again later"
      })
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-slate-800">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>

        <div className="space-y-6">
          <div>
            <SectionHeader title="Interface" />
            <div className="space-y-2">
              <CategoryButton
                icon={Palette}
                title="Appearance"
                href="/settings/appearance"
              />
            </div>
          </div>

          <div>
            <SectionHeader title="Player & Content" />
            <div className="space-y-2">
              <CategoryButton
                icon={Play}
                title="Player and audio"
                href="/settings/player-and-audio"
              />
              <CategoryButton
                icon={Globe}
                title="Content"
                href="/settings/library-and-content"
              />
            </div>
          </div>

          <div>
            <SectionHeader title="Privacy & Security" />
            <div className="space-y-2">
              <CategoryButton
                icon={Shield}
                title="Privacy"
                href="/settings/privacy"
              />
            </div>
          </div>

          <div>
            <SectionHeader title="Storage & Data" />
            <div className="space-y-2">
              <CategoryButton
                icon={Database}
                title="Storage"
                href="/settings/storage"
              />
              <CategoryButton
                icon={RotateCcw}
                title="Backup and restore"
                href="/settings/backup-and-restore"
              />
            </div>
          </div>

          <div>
            <SectionHeader title="System & About" />
            <div className="space-y-2">
              <CategoryButton
                icon={Link2}
                title="Open supported links"
                href="/settings/supported-links"
              />
              <CategoryButton
                icon={RefreshCw}
                title="Updater"
                onClick={checkForUpdates}
              />
              <CategoryButton
                icon={Info}
                title="About"
                href="/settings/about"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
