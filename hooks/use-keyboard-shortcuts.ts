"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    const activeElement = document.activeElement
    const isInputField = activeElement instanceof HTMLInputElement ||
                        activeElement instanceof HTMLTextAreaElement ||
                        activeElement?.getAttribute('contenteditable') === 'true'

    if (isInputField && !e.ctrlKey && !e.metaKey) {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatches = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
      const shiftMatches = shortcut.shift ? e.shiftKey : !e.shiftKey
      const altMatches = shortcut.alt ? e.altKey : !e.altKey

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        e.preventDefault()
        shortcut.action()
        break
      }
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])
}

export const KEYBOARD_SHORTCUTS = {
  SEARCH: { key: 'k', ctrl: true, description: 'Open search' },
  ESCAPE: { key: 'Escape', description: 'Close dialog' },
  TAB_1: { key: '1', alt: true, description: 'Go to Porn' },
  TAB_2: { key: '2', alt: true, description: 'Go to Library' },
  TAB_3: { key: '3', alt: true, description: 'Go to Music' },
  TAB_4: { key: '4', alt: true, description: 'Go to AI' },
  TAB_5: { key: '5', alt: true, description: 'Go to Settings' },
  FAVORITE: { key: 'f', ctrl: true, description: 'Add to favorites' },
  HELP: { key: '/', shift: true, description: 'Show keyboard shortcuts' },
}
