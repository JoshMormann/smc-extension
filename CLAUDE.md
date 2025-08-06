# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the SREF Mining Chrome Extension.

## Project Overview

This is a **Chrome Extension** that mines SREF codes from MidJourney results on Discord and saves them to the SREF Manager library. It creates a seamless "mine-to-manage" workflow for AI artists.

## Commands

### Development
- `npm install` - Install dependencies
- `npm run dev` - Development build with watch mode
- `npm run build` - Production build for Chrome extension
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean dist directory

### Extension Loading
- Build the extension with `npm run build`
- Go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked" and select the `dist` folder

## Architecture

### Core Components

**Background Service Worker** (`src/background/background.ts`)
- Handles authentication with Supabase
- Manages API calls to SREF Manager backend
- Processes messages between content scripts and popup
- Shows notifications and manages extension badge

**Content Script** (`src/content/content.ts` + `content.css`)
- Injects into Discord pages
- Detects SREF codes in MidJourney results
- Provides mining UI (buttons, modals)
- Handles SREF extraction and user input

**Popup Interface** (`src/popup/popup.html` + `popup.ts`)
- Extension popup accessible from toolbar
- Authentication status and sign-in
- Recent SREF activity display
- Quick access to SREF Manager

**Shared Services** (`src/shared/supabase.ts`)
- Supabase client configuration
- Authentication service (AuthService)
- SREF management service (SREFService)
- Shared between all extension components

### Key Features

1. **Auto-Detection**: Scans Discord for `--sref` codes in messages
2. **UI Injection**: Adds "Mine SREF" buttons to detected results
3. **Mining Modal**: Beautiful popup for naming and tagging SREFs
4. **Authentication**: OAuth with Google/Discord via Supabase
5. **Backend Sync**: Direct integration with SREF Manager database
6. **Visual Feedback**: Badges, notifications, and status updates

## Configuration Required

### Supabase Setup
Update `src/shared/supabase.ts` with your credentials:
```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### SREF Manager URL
Update `src/popup/popup.ts` with your app URL:
```typescript
const libraryUrl = 'https://your-sref-manager-url.com';
```

### Extension Icons
Create icons in `/icons/` directory:
- `icon-16.png` (16x16) - Toolbar
- `icon-32.png` (32x32) - Windows
- `icon-48.png` (48x48) - Extension management
- `icon-128.png` (128x128) - Chrome Web Store

## Development Workflow

### Session Start Checklist
1. Verify Supabase configuration is complete
2. Check that icons exist (or create placeholders)
3. Run `npm install` if first time
4. Build with `npm run build`
5. Load extension in Chrome for testing

### Testing Strategy
1. **Development**: Use `npm run dev` for automatic rebuilds
2. **Discord Testing**: Navigate to Discord with MidJourney results
3. **SREF Detection**: Look for auto-injected mining buttons
4. **Authentication**: Test sign-in flow through popup
5. **Mining Flow**: Complete full SREF save workflow

### Key Files to Monitor
- `manifest.json` - Extension permissions and configuration
- `webpack.config.js` - Build process (rarely needs changes)
- `src/types/index.ts` - Shared TypeScript types
- Chrome Developer Tools → Extensions for debugging

## Technical Notes

### Chrome Extension Manifest V3
- Uses service worker instead of background pages
- Requires specific permissions for Discord integration
- Message passing between contexts is asynchronous
- Storage API used for temporary data, Supabase for persistence

### Discord Integration Challenges
- Dynamic content requires mutation observers
- Need to handle Discord's theme changes (light/dark)
- Element detection must be resilient to DOM changes
- Timing issues with message loading

### Supabase Integration
- Extension uses same backend as main SREF Manager
- Authentication tokens stored in Chrome storage
- API calls proxied through background service worker
- Error handling crucial for network issues

## Debugging

### Chrome DevTools
- **Background**: `chrome://extensions/` → "service worker" link
- **Content Script**: Regular DevTools on Discord pages
- **Popup**: Right-click extension icon → "Inspect popup"

### Common Issues
- **SREF Not Detected**: Check Discord DOM structure changes
- **Auth Fails**: Verify Supabase URLs and redirect configuration
- **Mining Modal**: CSS conflicts with Discord styles
- **API Errors**: Check network tab and background script logs

## Security Considerations

- Extension only requests necessary permissions
- No sensitive data stored in extension storage
- OAuth handled through secure Supabase flow
- Content script isolated from page JavaScript
- All API calls go through background script for security

## Connection to Main Project

This extension integrates with the main SREF Manager project:
- **Database**: Same Supabase tables (`sref_codes`, `code_images`, `code_tags`)
- **Authentication**: Same user accounts and sessions
- **Data Models**: Compatible SREF code structures
- **UI Consistency**: Similar styling and branding

The extension essentially provides a "frontend" for SREF creation while the main app handles organization, discovery, and management.

## Future Enhancements

**Planned Features:**
- Advanced SREF version detection (SV4 vs SV6)
- Bulk mining capabilities
- Extension settings and preferences
- Better prompt extraction from Discord messages
- Support for other platforms beyond Discord

**Performance Optimizations:**
- Lazy loading of UI components
- Efficient DOM scanning algorithms
- Background sync optimization
- Memory management for long Discord sessions

This architecture enables a seamless "mine-to-manage" workflow that differentiates the SREF Manager platform in the AI art community.