# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment (see Configuration section below)
# Edit src/shared/supabase.ts with your Supabase credentials
# Edit src/popup/popup.ts with your SREF Manager URL  

# Build extension
npm run build

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode" 
# 3. Click "Load unpacked"
# 4. Select the `dist` folder
```

## Configuration

### Required Configuration

Before building, you must configure these files:

**1. Supabase Credentials** (`src/shared/supabase.ts`)
```typescript
// Replace these with your actual Supabase project values
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

**2. SREF Manager URL** (`src/popup/popup.ts`)
```typescript
// Replace with your deployed SREF Manager URL
const libraryUrl = 'https://your-sref-manager-url.com';
// For local development: http://localhost:5173
```

### Optional Configuration

**Extension Icons** (recommended for testing)
- Create placeholder icons in `/icons/` directory
- Required sizes: 16x16, 32x32, 48x48, 128x128 pixels
- Format: PNG with transparent backgrounds

## Development Workflow

### 1. Development Build (Recommended)
```bash
npm run dev
```
- Watches for file changes
- Automatically rebuilds on save
- Includes source maps for debugging
- **Note**: You still need to reload the extension in Chrome after builds

### 2. Reload Extension in Chrome
After each build:
1. Go to `chrome://extensions/`
2. Find "SREF Mining Extension"
3. Click the reload button (🔄)

### 3. Testing on Discord
1. Navigate to a Discord server with MidJourney
2. Look for messages containing `--sref` codes
3. Mining buttons should appear automatically
4. Test the full mining flow

## Debugging

### Background Script
```bash
# Go to chrome://extensions/
# Find your extension
# Click "service worker" link
# DevTools will open for background script
```

### Content Script
```bash
# Open Discord in Chrome
# Open DevTools (F12)
# Check Console tab for content script logs
# Check Network tab for API calls
```

### Popup
```bash
# Right-click extension icon in toolbar
# Select "Inspect popup"
# DevTools will open for popup
```

### Common Debug Locations
- Background script logs: `chrome://extensions/` → service worker
- Content script logs: Discord page DevTools console
- API errors: Network tab in DevTools
- Extension errors: `chrome://extensions/` → "Errors" button

## Project Structure

```
src/
├── background/         # Service worker
│   └── background.ts   # Auth, API calls, messaging
├── content/           # Discord integration  
│   ├── content.ts     # SREF detection & mining UI
│   └── content.css    # Styling for injected elements
├── popup/             # Extension popup
│   ├── popup.html     # UI structure
│   └── popup.ts       # Auth status, recent activity
├── shared/            # Common services
│   └── supabase.ts    # Database & auth services
└── types/             # TypeScript definitions
    └── index.ts       # Shared types
```

## Testing Strategy

### 1. Unit Testing (Manual)
- Test each component individually
- Verify TypeScript compilation
- Check ESLint rules

### 2. Integration Testing
- Test message passing between scripts
- Verify Supabase authentication
- Test SREF detection accuracy

### 3. User Flow Testing
1. **Discovery**: SREF codes detected automatically
2. **Mining**: Click mining button → modal opens
3. **Input**: Enter title and tags
4. **Save**: Submit → data saved to Supabase
5. **Feedback**: Success notification appears

### 4. Cross-Environment Testing
- Test in different Discord themes (light/dark)
- Test with various MidJourney result formats
- Test authentication with different providers

## Performance Considerations

### Content Script Optimization
- Use mutation observers efficiently
- Debounce DOM scanning operations
- Clean up event listeners on page unload
- Minimize CSS injection impact

### Background Script Optimization
- Cache authentication state
- Batch API calls when possible
- Handle network failures gracefully
- Manage extension badge updates efficiently

## Common Issues & Solutions

### "SREF Not Detected"
- **Check**: Discord DOM structure hasn't changed
- **Fix**: Update selectors in content script
- **Debug**: Log detected messages and elements

### "Authentication Failed"
- **Check**: Supabase URL and keys are correct
- **Check**: OAuth redirect URLs configured properly
- **Debug**: Monitor network requests in DevTools

### "Extension Won't Load"
- **Check**: manifest.json syntax is valid
- **Check**: All required files exist in dist/
- **Fix**: Run `npm run build` to regenerate dist/

### "Mining Modal Styling Issues"
- **Cause**: CSS conflicts with Discord styles
- **Fix**: Use more specific selectors
- **Fix**: Increase CSS specificity or !important

### "Background Script Errors"
- **Check**: Service worker console for errors
- **Common**: Async/await issues with Chrome APIs
- **Fix**: Proper error handling for all async operations

## Deployment Preparation

### Before Publishing
1. **Icons**: Create all required icon sizes
2. **Permissions**: Minimize requested permissions
3. **Testing**: Test on multiple Discord servers
4. **Documentation**: Update README with latest features
5. **Version**: Bump version in manifest.json

### Chrome Web Store Requirements
- Complete set of icons (16, 32, 48, 128px)
- Detailed description and screenshots
- Privacy policy (if collecting user data)
- Store listing images and promotional content

## Security Notes

### Permissions Used
- `storage`: For caching auth state and recent SREFs
- `activeTab`: For content script injection
- `scripting`: For programmatic script injection
- Host permissions: Discord domains only

### Data Handling
- No sensitive data stored in extension storage
- All API calls proxied through background script
- Authentication tokens handled by Supabase client
- User data encrypted in transit to Supabase

### Content Security Policy
- No eval() or inline scripts allowed
- External resources must be declared in manifest
- All dynamic content properly sanitized

## Connection to Main SREF Manager

This extension is designed to work seamlessly with the main SREF Manager application:

- **Same Database**: Uses identical Supabase schema
- **Same Auth**: Compatible user accounts and sessions  
- **Same Types**: Shared data models and interfaces
- **Complementary UX**: Extension handles creation, app handles management

The goal is a unified ecosystem where users can mine SREFs anywhere and manage them in the main application.