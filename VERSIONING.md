# FitTrack Versioning System

## Overview
FitTrack now includes a comprehensive versioning system for tracking app updates and notifying users when new versions are available.

## Version Structure

### Version Format: `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes or major feature additions (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backwards compatible (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, small improvements (e.g., 1.0.0 → 1.0.1)

Current Version: **1.0.0**

## Files Involved

### 1. `lib/version.ts` (Central Version File)
```typescript
export const APP_VERSION = '1.0.0'        // App version
export const CACHE_VERSION = 1            // Service worker cache version
export const BUILD_DATE = '2026-02-01'    // Auto-generated build date
```

### 2. `public/sw.js` (Service Worker)
```javascript
// Version: 1.0.0
const APP_VERSION = '1.0.0';
const CACHE_VERSION = 1;
const CACHE_NAME = `fittrack-v${CACHE_VERSION}`;
```

### 3. `components/update-notification.tsx`
- Shows notification when new version is available
- Allows user to update immediately
- Can be dismissed (shows again after 1 hour)

### 4. `components/version-display.tsx`
- Displays version in settings page
- Shows build date
- Can be used in compact mode

## How to Update

### For Minor Updates (Bug Fixes, Small Changes)

1. **Update version in `lib/version.ts`:**
```typescript
export const APP_VERSION = '1.0.1'  // Changed from 1.0.0
```

2. **Update service worker version in `public/sw.js`:**
```javascript
const APP_VERSION = '1.0.1';  // Changed from 1.0.0
const CACHE_VERSION = 1;      // No change if cache strategy unchanged
```

3. **Build and deploy:**
```bash
npm run build
# Deploy to your hosting
```

4. **User Experience:**
- Next time user visits, they see update notification
- Click "Update Now" → app refreshes with new version
- Or automatic update on next page load

### For Major Updates (Cache Changes, New Features)

1. **Update version in `lib/version.ts`:**
```typescript
export const APP_VERSION = '1.1.0'  // Minor feature
export const CACHE_VERSION = 2      // Increment if cache strategy changed
```

2. **Update service worker:**
```javascript
const APP_VERSION = '1.1.0';
const CACHE_VERSION = 2;  // This will clear old cache
```

3. **Build and deploy**

4. **User Experience:**
- Old cache automatically cleared
- New cache created
- Update notification appears

## Update Notification System

### How It Works

1. **Detection:**
   - Service worker detects when new version is available
   - Triggers update notification component

2. **User Action:**
   - **"Update Now"**: Immediately reloads with new version
   - **"Dismiss"**: Hides for 1 hour, then shows again
   - **Auto-update**: If user doesn't act, updates on next visit

3. **Visual Design:**
   - Beautiful gradient notification at top of screen
   - Green/blue theme matching app
   - Clear "Update Now" call-to-action

### Customization

Edit `components/update-notification.tsx` to:
- Change notification position
- Adjust auto-dismiss timeout
- Modify styling
- Add changelog link

## Version Display

### Settings Page
Users can see current version in Settings → App Information:
- Version number (e.g., v1.0.0)
- Build date

### Compact Display
Can be used anywhere in the app:
```tsx
import { VersionDisplay } from '@/components/version-display'

<VersionDisplay variant="compact" />  // Shows: v1.0.0
```

## Cache Versioning

### When to Increment `CACHE_VERSION`:

**Increment when:**
- ✅ Changing caching strategies
- ✅ Updating precached URLs list
- ✅ Modifying service worker logic
- ✅ Adding/removing cached routes

**Don't increment for:**
- ❌ Regular code updates
- ❌ Content changes
- ❌ Styling updates
- ❌ Component changes

### Example Scenarios:

**Scenario 1: Bug Fix**
```typescript
// lib/version.ts
APP_VERSION: '1.0.0' → '1.0.1'

// public/sw.js  
APP_VERSION: '1.0.0' → '1.0.1'
CACHE_VERSION: 1 (no change)
```

**Scenario 2: New Feature + Cache Change**
```typescript
// lib/version.ts
APP_VERSION: '1.0.1' → '1.1.0'
CACHE_VERSION: 1 → 2

// public/sw.js
APP_VERSION: '1.0.1' → '1.1.0'
CACHE_VERSION: 1 → 2
```

**Scenario 3: Major Rewrite**
```typescript
// lib/version.ts
APP_VERSION: '1.1.0' → '2.0.0'
CACHE_VERSION: 2 → 3

// public/sw.js
APP_VERSION: '1.1.0' → '2.0.0'
CACHE_VERSION: 2 → 3
```

## Testing Updates Locally

1. **Make changes and update version**
2. **Build:** `npm run build`
3. **Start:** `npm start`
4. **Open in browser**
5. **Make another change, increment version**
6. **Rebuild and reload browser**
7. **You should see update notification**

## User Communication

When releasing updates, consider:

1. **Changelog**: Document what changed
2. **Social media**: Announce major updates
3. **In-app**: Update notification tells users update is available
4. **Settings**: Version number always visible

## Troubleshooting

### Users Not Seeing Updates

**Check:**
1. Service worker registered? (Console: "✅ Service Worker registered")
2. Version incremented in both `lib/version.ts` and `public/sw.js`?
3. New build deployed successfully?
4. Cache cleared on server (CDN)?

**Force Update:**
1. Increment `CACHE_VERSION`
2. Add `skipWaiting: true` temporarily
3. Rebuild and deploy

### Update Notification Not Showing

**Check:**
1. `<UpdateNotification />` component in layout?
2. Browser console for errors?
3. Service worker supports updates? (Some browsers limit frequency)

**Debug:**
```javascript
// In browser console
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Waiting:', reg.waiting)
  console.log('Installing:', reg.installing)
  console.log('Active:', reg.active)
})
```

## Best Practices

1. **Version consistently**: Update version in ALL places when releasing
2. **Test locally**: Always test update flow before deploying
3. **Document changes**: Keep changelog for each version
4. **Semantic versioning**: Follow MAJOR.MINOR.PATCH convention
5. **Cache carefully**: Only increment CACHE_VERSION when needed
6. **Communicate**: Let users know what's new

## Future Enhancements

Potential additions:
- Changelog modal on update
- Release notes in-app
- Beta/canary versioning
- Automatic version bumping (CI/CD)
- Update scheduling (e.g., only update at midnight)

## Quick Reference

```bash
# Release a patch (1.0.0 → 1.0.1)
1. Edit lib/version.ts: APP_VERSION = '1.0.1'
2. Edit public/sw.js: APP_VERSION = '1.0.1'
3. npm run build && deploy

# Release new feature (1.0.1 → 1.1.0)
1. Edit lib/version.ts: APP_VERSION = '1.1.0'
2. Edit public/sw.js: APP_VERSION = '1.1.0'
3. If cache changed: CACHE_VERSION++
4. npm run build && deploy

# Force cache refresh
1. Edit public/sw.js: CACHE_VERSION++
2. npm run build && deploy
```

---

**Current Version**: 1.0.0  
**Last Updated**: 2026-02-01  
**Versioning System**: Active ✅
