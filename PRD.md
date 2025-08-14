# SMC Extension - Product Requirements Document (Updated)

## 🎯 **Product Overview**

The SMC (SREF Manager Collection) Extension is a Chrome extension that enhances the Midjourney web application experience by allowing users to quickly save discovered SREF codes to their personal SMC Manager account. The extension provides seamless integration between Midjourney and the SMC Manager web application through intelligent viewport-based SREF detection and one-click saving functionality.

## 🎯 **Core Value Proposition**

- **Speed**: Save SREF codes directly from Midjourney without switching applications
- **Visual Feedback**: Instantly see which SREF codes are already saved vs. available to save
- **Seamless Integration**: Works within the existing Midjourney web interface with infinite scroll optimization
- **Minimal Friction**: Simple naming process for quick saves
- **Performance**: Smooth scrolling experience with intelligent viewport-based processing

## 🔧 **Technical Architecture**

### **Target Platform**
- **Primary**: Midjourney web application (not Discord)
- **Authentication**: Supabase session detection from SMC Manager web app
- **Data Storage**: Direct to Supabase when authenticated
- **Performance**: Viewport-based scanning optimized for infinite scroll

### **Extension Behavior**
- **When Not Authenticated**: Silent operation (no popups, no errors)
- **When Authenticated**: Full functionality with visual indicators
- **Scroll Optimization**: Loading indicators during scroll, processing on pause

## 📋 **Core Functionality**

### **1. SREF Detection & Analysis**
- **Method**: Viewport-based DOM scanning for SREF code patterns
- **Frequency**: On page load, scroll events (debounced), and dynamic content changes
- **Scope**: Scan only visible content in viewport with intelligent scroll handling
- **Performance Optimization**: 
  - Show loading indicators (spinners) during active scrolling
  - Process SREF detection when user pauses scrolling (debounced, 500ms)
  - Lazy load indicators as content comes into view
  - Cache processed SREF codes to avoid re-scanning
  - Use Intersection Observer API for efficient viewport detection

### **2. Visual Status Indicators**
- **Known SREF Codes**: Display green check icon (✓) inside SREF span tags
- **Unknown SREF Codes**: Display SMC logo (16x16px) inside SREF span tags
- **Loading State**: Show spinner icon during processing
- **Placement**: Inline within existing SREF code elements
- **Progressive Loading**: Indicators appear as content becomes visible

### **3. Save Functionality**
- **Trigger**: Click on SMC logo next to unknown SREF code
- **UI**: Tooltip-style input field with "Name this SREF" placeholder
- **Submission**: Enter key or submit button
- **Process**: 
  1. Upload all images from that SREF output instance
  2. Associate images with the SREF code and user-provided name
  3. Save to user's SMC Manager account
  4. Update all instances of that SREF code to show green check
- **Loading State**: Show save progress indicator during upload

### **4. Session Management**
- **Detection**: Check for existing Supabase session from SMC Manager web app
- **Silent Mode**: If no session, extension operates silently without errors
- **Documentation**: User guidance provided on main SMC Manager website

## 🎨 **User Experience Flow**

### **Authenticated User Flow**
1. User browses Midjourney web app (infinite scroll)
2. Extension scans visible content for SREF codes
3. During scrolling: Loading spinners appear for new content
4. When scrolling pauses: Visual indicators appear:
   - Green checks for already-saved SREF codes
   - SMC logos for unsaved SREF codes
5. User clicks SMC logo on desired SREF code
6. Input tooltip appears with "Name this SREF" placeholder
7. User enters name and presses Enter
8. Save progress indicator shows during upload
9. Images upload and SREF saves to account
10. All instances of that SREF code update to green check
11. User continues scrolling with smooth performance

### **Unauthenticated User Flow**
1. User browses Midjourney web app
2. Extension operates silently (no visual indicators or processing)
3. No errors or popups displayed
4. User can use Midjourney normally with full performance
5. Documentation on SMC Manager website explains authentication requirement

## 🔧 **Technical Requirements**

### **Content Scripts**
- **Target**: Midjourney web application
- **Permissions**: DOM access, storage access
- **Injection**: Automatic on Midjourney pages
- **Performance**: Viewport-based scanning with scroll optimization

### **Background Script**
- **Purpose**: Session management, Supabase communication
- **Storage**: Chrome extension storage for session state
- **Caching**: Cache processed SREF codes and user's saved codes

### **Popup Interface**
- **Purpose**: Extension settings and status (minimal)
- **Content**: Authentication status, basic info

### **Data Flow**
1. **Viewport Detection**: Content script monitors visible content using Intersection Observer
2. **Scroll Handling**: Debounced scroll events trigger processing
3. **Authentication**: Background script checks Supabase session
4. **Comparison**: Query user's saved SREF codes from Supabase (cached)
5. **Visual Update**: Content script updates DOM with indicators progressively
6. **Save Process**: Background script handles image upload and data saving

## 📊 **Data Models**

### **SREF Code Detection**
```typescript
interface DetectedSREF {
  code: string;
  element: HTMLElement;
  images: string[];
  isKnown: boolean;
  timestamp: number;
  isProcessed: boolean;
  isVisible: boolean;
}
```

### **Viewport Scanner State**
```typescript
interface ScannerState {
  processedElements: Set<HTMLElement>;
  scrollDebounceTimer: number;
  userSavedCodes: Set<string>;
  isAuthenticated: boolean;
  isProcessing: boolean;
}
```

### **Save Request**
```typescript
interface SaveSREFRequest {
  code: string;
  name: string;
  images: string[];
  userId: string;
}
```

## 🚀 **MVP Features**

### **Phase 1: Core Detection & Save**
- [ ] Viewport-based SREF code detection with scroll optimization
- [ ] Supabase session detection
- [ ] Visual indicators (check marks, SMC logos, loading spinners)
- [ ] Basic save functionality with naming
- [ ] Image upload to Supabase
- [ ] Scroll debouncing and performance optimization

### **Phase 2: Enhanced UX**
- [ ] Loading states during save operations
- [ ] Error handling and user feedback
- [ ] Optimized viewport scanning performance
- [ ] Progressive loading of indicators
- [ ] Cache management for processed elements

### **Future Enhancements**
- [ ] Local storage for offline detection
- [ ] Queue system for power users
- [ ] Context menu options
- [ ] Advanced editing capabilities
- [ ] Batch processing for multiple SREF codes

## 🔒 **Security & Privacy**

### **Authentication**
- **Method**: Supabase session detection
- **Scope**: Read user's saved SREF codes, write new SREF codes
- **Storage**: No sensitive data stored locally

### **Data Handling**
- **Images**: Uploaded directly to Supabase storage
- **SREF Codes**: Stored in user's personal SMC Manager account
- **Privacy**: No data collection beyond SREF saving functionality

## 📈 **Success Metrics**

### **User Engagement**
- Number of SREF codes saved via extension
- Time saved per SREF code save operation
- User retention and continued usage
- Scroll performance impact (should be minimal)

### **Technical Performance**
- SREF detection accuracy
- Save operation success rate
- Extension load time and responsiveness
- Scroll performance metrics
- Viewport processing efficiency

## 🎯 **Acceptance Criteria**

### **Functional Requirements**
- [ ] Extension detects SREF codes in viewport on Midjourney pages
- [ ] Visual indicators appear progressively as content becomes visible
- [ ] Loading spinners show during active scrolling
- [ ] Clicking SMC logo opens naming input
- [ ] Save operation uploads images and creates SREF entry
- [ ] All instances of saved SREF code update to green check
- [ ] Extension operates silently when not authenticated
- [ ] Smooth scrolling performance maintained

### **Technical Requirements**
- [ ] No errors or popups when user is not authenticated
- [ ] Smooth integration with existing Midjourney UI
- [ ] Responsive save operations with loading states
- [ ] Proper error handling for network issues
- [ ] Clean DOM manipulation without breaking existing functionality
- [ ] Efficient viewport-based scanning with scroll optimization
- [ ] Proper debouncing of scroll events

### **User Experience Requirements**
- [ ] Intuitive visual indicators
- [ ] Simple one-click save process
- [ ] Clear feedback for save operations
- [ ] No interference with normal Midjourney usage
- [ ] Fast and responsive interface
- [ ] Smooth infinite scroll experience
- [ ] Progressive loading of indicators

## 🚀 **Implementation Priority**

1. **Session Detection & Supabase Integration**
2. **Viewport-Based SREF Detection Algorithm**
3. **Scroll Optimization & Performance**
4. **Visual Indicator System with Progressive Loading**
5. **Save Functionality with Image Upload**
6. **Error Handling & Edge Cases**
7. **Performance Optimization & Caching**
8. **Testing & Polish**

## 🔧 **Technical Implementation Details**

### **Scroll Optimization Strategy**
```typescript
class SREFViewportScanner {
  private processedElements = new Set<HTMLElement>();
  private scrollDebounceTimer: number;
  private intersectionObserver: IntersectionObserver;
  
  onScroll() {
    // Clear previous timer
    clearTimeout(this.scrollDebounceTimer);
    
    // Show loading indicators for new content
    this.showLoadingIndicators();
    
    // Debounce actual processing
    this.scrollDebounceTimer = setTimeout(() => {
      this.processVisibleContent();
    }, 500);
  }
  
  processVisibleContent() {
    // Use Intersection Observer to find visible SREF elements
    // Process only unprocessed elements in viewport
    // Cache results to avoid re-processing
  }
}
```

---

*This updated PRD incorporates viewport-based scanning and scroll optimization to ensure smooth performance on Midjourney's infinite scroll interface while maintaining all core functionality.*
