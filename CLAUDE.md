# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SMC Extension is a Chrome extension for mining SREF codes from MidJourney and saving them to SMC Manager. It provides seamless integration between Midjourney web app and SMC Manager through intelligent viewport-based SREF detection and one-click saving functionality.

**Core Value**: Speed, visual feedback, and minimal friction - save SREF codes directly from Midjourney without switching applications, with instant visual indicators showing which codes are already saved vs. available to save.

## Development Commands

```bash
# Build the extension (required after changes)
npm run build

# Development with hot reload
npm run dev

# Preview build output
npm run preview
```

**Important**: After making TypeScript changes, always run `npm run build` before testing in Chrome. The extension loads from the `dist/` folder.

## Build System

- **Build Tool**: Vite with CRXJS plugin for Chrome extension support
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Output**: `dist/` folder contains the built extension for Chrome
- **Packaging**: Built extensions are zipped to `release/` folder automatically

## Architecture

### Core Components

**Background Script** (`src/background/background.ts`)
- Service worker handling message routing between popup and content scripts
- Manages session transfer from SMC Manager web app to extension
- Implements keep-alive mechanism to prevent service worker sleep
- Routes authentication and SREF-related messages
- Handles image upload and data saving operations

**Content Script** (`src/content/content.ts`)
- Injected into MidJourney pages (`*.midjourney.com/*`)
- Viewport-based DOM scanning for SREF codes with scroll optimization
- Progressive loading of visual indicators as content becomes visible
- Communicates with background script via Chrome messaging API
- **Performance Features**: Debounced scroll events, Intersection Observer API, caching of processed elements

**SREF Scanner** (`src/content/sref-scanner.ts`)
- Viewport-based SREF detection optimized for infinite scroll
- Loading indicators during active scrolling, processing on scroll pause
- Visual indicators: Green checks for saved codes, SMC logos for unsaved codes
- One-click save functionality with tooltip-style naming input

**Popup Interface** (`src/popup/popup.html` + `popup.ts`)
- Extension's main UI showing authentication status
- Session transfer button for SMC Manager integration
- Debug tools and user information display

**Supabase Integration** (`src/shared/supabase.ts`)
- AuthService: Session management and SSO from SMC Manager
- SREFService: Database operations for saving SREF codes with image uploads
- Custom storage adapter using Chrome extension storage API

### Authentication Flow

1. User logs into SMC Manager web app (localhost:5173)
2. Extension detects SMC Manager tab and extracts session from localStorage
3. Session transferred to extension via Chrome scripting API
4. Extension authenticates with Supabase using transferred session
5. User can then save SREF codes directly from MidJourney pages

### Message Passing

Uses Chrome's runtime messaging API:
- `GET_AUTH_STATUS` - Check authentication state
- `TRANSFER_SESSION` - Transfer session from SMC Manager
- `TEST_PING` - Service worker connectivity test
- `GET_USER_SREF_CODES` - Fetch user's saved codes

### Data Models

Key interfaces in `src/types/index.ts`:
- `DetectedSREF` - SREF codes found on pages
- `AuthState` - User authentication status
- `SaveSREFRequest` - SREF saving payload
- `ScannerState` - Content script state

## Testing

1. Build: `npm run build`
2. Load unpacked extension from `dist/` in Chrome
3. Test in incognito mode first (avoids cache issues)
4. Check service worker console in chrome://extensions/
5. Monitor content script logs in page DevTools

## Development Workflow

1. Make changes to TypeScript files
2. Run `npm run build`  
3. Reload extension in chrome://extensions/
4. Test functionality on MidJourney pages
5. Check both service worker and page console logs for debugging

## Current State

### Foundation Complete (CRXJS Migration Success)
- ✅ **Build System**: Fast 280ms builds with CRXJS/Vite (down from 2s+ Webpack)
- ✅ **Service Worker**: Receiving and responding to TEST_PING messages
- ✅ **Content Script**: Successfully connecting to service worker (in TEST mode only)
- ✅ **Popup Script**: Loading, initializing, and communicating properly

### Authentication Status: BROKEN
- ❌ **Session Transfer**: Does NOT work - violates Chrome's same-origin policy
- ❌ **Supabase Integration**: Cannot access web app sessions due to security restrictions
- ❌ **Cross-Origin Authentication**: Fundamental architectural flaw - not possible with current approach

### SREF Functionality Status: BLOCKED
- ❌ **SREF Scanning**: Content script is in TEST mode only, no actual scanning
- ❌ **Visual Indicators**: Cannot be implemented without working authentication
- ❌ **Save Functionality**: Depends on authentication which is broken

### Critical Issues Blocking Development
1. **Authentication Architecture**: Current approach violates browser security (same-origin policy)
2. **Session Sharing**: Chrome extensions cannot access localhost:5173 localStorage 
3. **Supabase Integration**: No valid session can be obtained from web app
4. **Multiple Rebuilds**: Project rebuilt from scratch multiple times attempting impossible architecture

### Alternative Authentication Approaches Needed
- Independent OAuth flow in extension
- API key approach
- PostMessage communication from web app
- Separate extension authentication system

### Project Has Been Rebuilt Multiple Times
The documentation references multiple ground-up rebuilds due to fundamental architectural issues that remain unresolved.