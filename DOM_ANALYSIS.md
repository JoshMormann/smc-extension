# MidJourney DOM Structure Analysis

## Key Findings from Screenshot and DOM Snippet

### SREF Code Location
- **Selector**: `button[title="Style reference"]`
- **Pattern**: `--sref 1591269566` (note: double dashes, not single)
- **Extraction regex**: `--sref\s+(\d+)`

### Container Structure
```html
<div class="absolute gap-0 flex-col shrink-0 grid h-full w-full grid-cols-[minmax(0,8fr)_minmax(0,3fr)]">
  <!-- Left side: 2x2 image grid -->
  <div class="grid gap-[1px] lg:gap-2 rounded-md relative group/mediaGrid" style="grid-template-columns: repeat(2, minmax(0px, 1fr)); grid-template-rows: repeat(2, minmax(0px, 1fr));">
    <!-- 4 image divs with cdn.midjourney.com images -->
  </div>
  
  <!-- Right side: Content section -->
  <div class="overflow-clip flex relative w-full flex-col group gap-1.5">
    <!-- Prompt text section -->
    <!-- Parameter buttons section including SREF button -->
    <div class="flex flex-wrap gap-1 empty:hidden">
      <button title="Image aspect ratio">--ar 2:1</button>
      <button title="Style reference">--sref 1591269566</button>  <!-- TARGET -->
      <button title="Version">--v 7</button>
    </div>
  </div>
</div>
```

### Image Extraction Strategy
- Images are in the left grid section: `img[src*="cdn.midjourney.com"]`
- Need to find common parent container to associate SREF with its 4 images
- Container has class pattern: `grid-cols-[minmax(0,8fr)_minmax(0,3fr)]`

### UI Insertion Point
- SREF button is in bottom parameter section alongside --ar and --v buttons
- Insert our indicator immediately after the SREF button
- Match existing button styling for seamless integration

### Container Relationship
- SREF button and images share the same top-level container
- Navigate up from SREF button to find the container with `grid-cols-` pattern
- Then find all `img[src*="cdn.midjourney.com"]` within that container

## Current Code Issues to Fix
1. **SREF Pattern**: Change from `sref\s+(\d+)` to `--sref\s+(\d+)`
2. **Button Selector**: Confirm `button[title="Style reference"]` is correct
3. **Container Finding**: Update `findImageContainer()` logic to match actual DOM structure
4. **Image Extraction**: Look for the grid container with specific column pattern