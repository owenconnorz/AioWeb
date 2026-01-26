"use client"

import { X, Keyboard } from "lucide-react"
import { Card } from "@/components/ui/card"

interface ShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  if (!isOpen) return null

  const shortcuts = [
    { keys: ["Ctrl", "K"], description: "Open search" },
    { keys: ["Alt", "1"], description: "Go to Porn Videos" },
    { keys: ["Alt", "2"], description: "Go to Library" },
    { keys: ["Alt", "3"], description: "Go to Music" },
    { keys: ["Alt", "4"], description: "Go to AI Tools" },
    { keys: ["Alt", "5"], description: "Go to Settings" },
    { keys: ["Ctrl", "F"], description: "Add to favorites (when viewing content)" },
    { keys: ["Shift", "/"], description: "Show this help" },
    { keys: ["Esc"], description: "Close dialogs" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl overflow-hidden border-0 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto bg-white p-4 dark:bg-slate-800">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <span className="text-sm text-slate-700 dark:text-slate-300">{shortcut.description}</span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key, i) => (
                    <kbd
                      key={i}
                      className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Use <kbd className="rounded bg-white px-1.5 py-0.5 dark:bg-slate-800">Cmd</kbd> instead of{" "}
          <kbd className="rounded bg-white px-1.5 py-0.5 dark:bg-slate-800">Ctrl</kbd> on Mac
        </div>
      </Card>
    </div>
  )
}
