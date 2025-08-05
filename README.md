# SREF Mining Chrome Extension

A Chrome extension that seamlessly mines SREF codes from MidJourney results on Discord and saves them directly to your SREF Manager library.

## Features

- 🔍 **Auto-Detection**: Automatically detects SREF codes in MidJourney results
- ⛏️ **One-Click Mining**: Extract SREF codes with associated images
- 🏷️ **Smart Tagging**: Add custom tags and titles to organize your collection  
- 🔄 **Seamless Sync**: Direct integration with SREF Manager backend
- 🔐 **Secure Auth**: OAuth authentication with Google and Discord
- 🎨 **Beautiful UI**: Modern, Discord-friendly interface

## Installation

### For Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/JoshMormann/smc-extension.git
   cd smc-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Copy your Supabase credentials to `src/shared/supabase.ts`
   - Update the SREF Manager URL in `src/popup/popup.ts`

4. **Build the extension**
   ```bash
   npm run build
   ```

5. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### For Users (Coming Soon)

The extension will be available on the Chrome Web Store once development is complete.

## Usage

1. **Install and Authenticate**
   - Click the extension icon in your Chrome toolbar
   - Sign in with Google or Discord

2. **Browse MidJourney Results**
   - Go to Discord and view MidJourney image results
   - The extension will automatically detect SREF codes

3. **Mine SREF Codes**
   - Click the "Mine SREF" button that appears on results
   - Add a title and tags
   - Click "Save to Library"

4. **Manage Your Collection**
   - Click "Open Library" in the extension popup
   - View and organize your saved SREF codes in SREF Manager

## Development

### Project Structure

```
src/
├── background/          # Service worker for background tasks
├── content/            # Content scripts for Discord integration
├── popup/              # Extension popup interface
├── shared/             # Shared utilities and services
└── types/              # TypeScript type definitions
```

### Available Scripts

- `npm run dev` - Development build with watch mode
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Architecture

The extension follows Chrome Extension Manifest V3 architecture:

- **Background Script**: Handles API calls, authentication, and message passing
- **Content Script**: Injects UI elements and detects SREF codes on Discord
- **Popup**: Provides user interface for authentication and status
- **Supabase Integration**: Connects to SREF Manager backend for data persistence

## Configuration

### Environment Variables

Update these values in `src/shared/supabase.ts`:

```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### URLs

Update the SREF Manager URL in `src/popup/popup.ts`:

```typescript
const libraryUrl = 'https://your-sref-manager-url.com';
```

## Security

- Uses Chrome Extension Manifest V3 for enhanced security
- OAuth authentication through Supabase
- No sensitive data stored in extension
- Content Security Policy enforced

## Browser Support

- Chrome 88+ (Manifest V3 requirement)
- Chromium-based browsers (Edge, Brave, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

---

**Note**: This extension is designed to work specifically with MidJourney results on Discord. Make sure you have the necessary permissions to use MidJourney and access Discord channels where the results are posted.