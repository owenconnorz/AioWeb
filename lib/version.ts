// IMPORTANT: When updating this version:
// 1. Update APP_VERSION below
// 2. Update CACHE_VERSION in /public/sw.js to match exactly
// 3. Add new entry to top of CHANGELOG in /components/changelog.tsx
//
// The update system will:
// - Show update notification to users via PWA Manager
// - Display changelog popup for new features
// - Clear old caches automatically
// - Reload app with new version
//
// Users will see:
// 1. Update notification banner with "Update Now" button
// 2. Loading screen during update installation
// 3. Automatic page refresh
// 4. Changelog popup showing what's new

export const APP_VERSION = "2.7.0"
export const CACHE_NAME = `tempted-v${APP_VERSION}`
