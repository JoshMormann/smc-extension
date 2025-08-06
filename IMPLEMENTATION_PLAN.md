# SREF Mining Extension - Implementation Plan

## Session Progress (2025-08-05)

### Completed ✅
- [x] Project setup and dependency installation
- [x] Fixed TypeScript compilation errors
- [x] Created placeholder icons for Chrome extension
- [x] Configured Supabase credentials from main SREF Manager project
- [x] Successfully loaded extension in Chrome (with minor icon loading issue)
- [x] Verified extension popup loads with proper authentication interface
- [x] Analyzed MidJourney web app HTML structure for SREF mining integration

### Current State
- Extension builds and loads in Chrome
- Supabase authentication configured (shared with main SREF Manager)
- Extension currently targets Discord (needs to be updated for MidJourney web app)
- Minor icon loading issue on extension reload (non-critical)

## Tomorrow's Implementation Tasks

### 1. Fix Icon Loading Issue (15 minutes)
**Problem**: Icons disappear after extension reload
**Solution**: 
- Investigate webpack copy configuration
- Ensure icons persist in `dist/icons/` after build
- May need to update webpack.config.js copy patterns

### 2. Update Extension Target: Discord → MidJourney (30 minutes)
**Current**: Extension targets `discord.com` and `*.discord.com`
**Target**: Update to `midjourney.com` and `*.midjourney.com`

**Files to Update**:
- `manifest.json`: Update `host_permissions` and `content_scripts.matches`
- `src/content/content.ts`: Update `isDiscordPage()` to `isMidJourneyPage()`
- Update console logs and comments referencing Discord

### 3. MidJourney DOM Integration (2-3 hours)
**Goal**: Inject SREF mining button next to SREF codes in MidJourney web app

**Target HTML Location**:
```html
<span class="select-none opacity-80">
  <span class="opacity-80">sref</span> 3622793667 
  <!-- INSERT MINING BUTTON HERE -->
</span>
```

**Implementation Strategy**:
1. **SREF Detection**: 
   - Look for buttons with `title="Style reference"`
   - Extract SREF code from button content (e.g., "3622793667")
   - Identify associated image grid

2. **Button Injection**:
   - Create small icon button matching MidJourney's styling
   - Use their CSS classes: `buttonActiveRing`, `group-button`, etc.
   - Insert inline after SREF number
   - Handle dark/light mode compatibility

3. **Data Extraction**:
   - **Images**: Extract `src` URLs from image grid (`img` tags in grid)
   - **Prompt**: Extract from prompt text section
   - **SREF Code**: Already identified from button
   - **Metadata**: Job ID from URLs (`/jobs/165f33c1-86fa-4839-bfe6-86345e6434d7`)

### 4. Mining Modal/Workflow (1-2 hours)
**Goal**: Create user interface for capturing and saving SREF data

**Flow**:
1. User clicks mining button → Modal opens
2. Pre-populate with extracted data:
   - SREF Code: "3622793667"
   - Images: Array of image URLs
   - Suggested title from prompt: "a rock star"
3. User adds custom title and tags
4. Save to Supabase via background script
5. Show success notification

### 5. Authentication Testing (30 minutes)
**Goal**: Verify Supabase auth flow works properly
- Test popup authentication state
- Test sign-in with Google/Discord
- Verify user session persistence
- Test SREF saving with authenticated user

### 6. Polish and Testing (1 hour)
- Test on various MidJourney pages
- Handle edge cases (no images, multiple SREF codes)
- Verify CSS doesn't conflict with MidJourney styles
- Test dark/light mode compatibility

## Technical Notes for Tomorrow

### MidJourney DOM Structure
- Uses complex Tailwind CSS utility classes
- Heavy use of hover states (`group-hover:flex`)
- Dark/light mode toggle classes (`dark:bg-dark-850`)
- Grid layout with 4 images per row
- SREF codes in dedicated button elements

### Key Selectors to Target
```javascript
// SREF buttons
const srefButtons = document.querySelectorAll('button[title="Style reference"]');

// Image grids (parent containers)
const imageGrids = document.querySelectorAll('.grid.gap-\\[1px\\].lg\\:gap-2');

// Prompt text
const promptText = document.querySelector('.break-word.shrink-0.text-sm');
```

### Styling Integration
- Match MidJourney's button classes
- Respect their spacing and hover states
- Use their color variables for consistency
- Handle both light and dark themes

## Success Criteria
- [x] Extension loads without errors in MidJourney web app
- [ ] SREF codes automatically detected
- [ ] Mining button appears inline with SREF display
- [ ] Modal captures all relevant data (images, prompt, code)
- [ ] Data saves successfully to Supabase
- [ ] UI integrates seamlessly with MidJourney design
- [ ] Works in both light and dark modes

## Files That Will Need Updates
1. `manifest.json` - Update domain permissions
2. `src/content/content.ts` - Complete rewrite for MidJourney DOM
3. `src/content/content.css` - Styling for MidJourney integration
4. `webpack.config.js` - Possibly fix icon copying
5. `src/popup/popup.ts` - Test and verify auth flow

## Estimated Time: 5-6 hours total
This should be achievable in a focused development session and get us to a functional beta for MidJourney SREF mining.