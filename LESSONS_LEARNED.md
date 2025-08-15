# Chrome Extension Development - Lessons Learned

## Project Overview
**SMC Extension** - Chrome extension for mining SREF codes from MidJourney and saving them to SMC Manager.

**Project Status**: TERMINATED - Discovered MidJourney Terms of Service prohibit automation, putting user accounts at risk.

**Key Insight**: Always check platform Terms of Service before building automation tools.

---

## Technical Architecture Lessons

### Build System Trade-offs

#### CRXJS + Vite (Initially Attempted)
**Pros:**
- Modern build tooling with hot reload
- Fast builds (280ms vs 2s+ Webpack)
- Good developer experience

**Cons:**
- Complex configuration for Chrome extensions
- Module compatibility issues with content scripts
- Overkill for simple extensions
- Node version dependencies (`crypto.hash` errors)

#### Simple TypeScript Compilation (Final Approach)
**Pros:**
- Reliable compilation to CommonJS
- No module system complexity
- Easy to debug
- Minimal dependencies

**Cons:**
- No hot reload
- Manual asset copying
- Less modern tooling

**Recommendation**: Use simple TypeScript compilation for Chrome extensions unless you need advanced features.

### Content Script Architecture

#### Module Systems Don't Work Well
- ES6 imports cause "Cannot use import statement outside a module" errors
- CommonJS exports cause "exports is not defined" errors in Chrome
- **Solution**: Bundle everything into a single file with no module system

#### DOM Manipulation in Dynamic React Apps

**Challenge**: MidJourney uses dynamic React DOM that constantly recreates elements

**Failed Approaches:**
1. **Complex state tracking** - JavaScript Maps lost when elements recreated
2. **Intersection Observer** - Overcomplicated for simple viewport detection  
3. **Mutation Observer without throttling** - Fires constantly, performance issues

**Working Approach**: DOM attributes for state management
- `data-smc-processed="true"` - marks elements as handled
- `data-smc-state="spinner|save-button|saved-check"` - tracks current state
- `data-smc-code="1591269566"` - stores extracted data

**Limitation**: DOM attributes get wiped when React re-renders elements

### State Management Patterns

#### ❌ Complex JavaScript State
```javascript
// Don't do this - lost when DOM changes
private processedElements: Map<HTMLElement, ProcessedElement> = new Map();
```

#### ✅ DOM Attribute-Based State  
```javascript
// Better - survives across DOM queries
element.setAttribute('data-smc-processed', 'true');
const unprocessed = document.querySelectorAll('button:not([data-smc-processed])');
```

#### ❌ Intersection Observer for Simple Viewport Detection
```javascript
// Overkill for basic viewport checking
this.intersectionObserver = new IntersectionObserver(/* complex callback */);
```

#### ✅ Simple Viewport Check
```javascript
// Simple and reliable
function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return rect.top >= -50 && rect.bottom <= window.innerHeight + 50;
}
```

---

## Performance Lessons

### Mutation Observer Throttling
**Problem**: MutationObserver fires constantly on dynamic sites
**Solution**: Throttle with setTimeout
```javascript
let mutationTimeout = 0;
const observer = new MutationObserver(() => {
  clearTimeout(mutationTimeout);
  mutationTimeout = setTimeout(() => {
    scanForElements();
  }, 100);
});
```

### Scroll Event Debouncing
**Pattern**:
```javascript
const handleScroll = () => {
  clearTimeout(this.scrollTimeout);
  this.scrollTimeout = setTimeout(() => {
    processVisibleElements();
  }, 500);
};
```

---

## Chrome Extension Specific Insights

### Manifest V3 Considerations
- Service workers replace background scripts
- Content scripts can't use ES6 modules easily
- Host permissions need to be specific

### Content Script Injection
**Timing Issues**: DOM might not be ready when content script loads
**Solution**: Check `document.readyState` and use `DOMContentLoaded` event

### Extension Debugging
- Service worker logs: `chrome://extensions/` → Developer mode → Inspect service worker
- Content script logs: Regular DevTools on the page
- Load unpacked for development from `dist/` folder

---

## Project Management Lessons

### When to Pivot from Complex to Simple
**Red Flags**:
- Fighting framework behavior instead of working with it
- Multiple rounds of "fixes" without addressing root cause
- Solution complexity growing beyond problem complexity

**Better Approach**: 
- Step back to first principles
- Consider simpler alternatives (popup button vs real-time injection)
- Sometimes manual processes are better than complex automation

### Platform Policy Research
**Critical**: Check Terms of Service before building automation
- MidJourney prohibits automation
- Could result in account suspension
- Research platforms early in project planning

### Technical Debt Recognition
**Signs**: 
- Fighting edge cases constantly
- Code complexity exceeding problem complexity
- Multiple agents/sessions without clear progress

**Action**: Consider fundamental approach changes rather than incremental fixes

---

## Alternative Approaches Considered

### Simple "Scan Page" Button
Instead of real-time DOM injection:
- Single button in extension popup
- One-shot page scan when clicked  
- Export to CSV + images
- No ongoing DOM monitoring
- **~50 lines vs 300+ lines**

### Bookmarklet Approach
- JavaScript bookmark instead of extension
- Click to scan and export
- No installation required
- Bypasses some extension complexity

---

## Reusable Code Patterns

### Basic Chrome Extension Structure
```json
// manifest.json
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0.0",
  "content_scripts": [{
    "matches": ["https://example.com/*"],
    "js": ["content.js"],
    "run_at": "document_end"
  }]
}
```

### Content Script Template
```javascript
class ContentScript {
  constructor() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    // Your content script logic here
  }
}

try {
  new ContentScript();
  console.log('✅ Extension loaded');
} catch (error) {
  console.error('❌ Extension failed:', error);
}
```

### Simple Build Script
```json
// package.json
{
  "scripts": {
    "build": "tsc && npm run copy-assets",
    "copy-assets": "cp manifest.json dist/ && cp popup.html dist/"
  }
}
```

---

## Future Recommendations

1. **Start simple**: Popup-based tools before real-time injection
2. **Check platform policies first**: Research automation rules early  
3. **Use DOM attributes for state**: More reliable than JavaScript objects in dynamic DOMs
4. **Throttle observers**: MutationObserver and scroll events need debouncing
5. **Consider alternatives**: Bookmarklets, manual processes, or different platforms
6. **Document decisions**: Keep architecture decision records for future reference

---

## Key Files in This Project

- `src/content-bundle.ts` - Final bundled content script approach
- `manifest.json` - Chrome extension configuration  
- `package.json` - Minimal build dependencies
- `tsconfig.json` - TypeScript compilation to CommonJS
- `CLAUDE.md` - Project context and current state

**Final State**: Working extension with DOM attribute-based state management, but project terminated due to platform policy constraints.