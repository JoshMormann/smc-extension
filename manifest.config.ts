import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'SMC Extension',
  version: pkg.version,
  description: 'Save SREF codes from Midjourney to your SMC Manager account',
  permissions: [
    'storage',
    'activeTab',
    'scripting',
    'tabs'
  ],
  host_permissions: [
    'https://midjourney.com/*',
    'https://www.midjourney.com/*',
    'https://*.midjourney.com/*',
    'https://qqbbssxxddcsuboiceey.supabase.co/*',
    'http://localhost:5173/*'
  ],
  background: {
    service_worker: 'src/background/background.ts'
  },
  content_scripts: [
    {
      matches: [
        'https://midjourney.com/*',
        'https://www.midjourney.com/*',
        'https://*.midjourney.com/*'
      ],
      js: ['src/content/content.ts'],
      run_at: 'document_end'
    }
  ],
  action: {
    default_popup: 'src/popup/popup.html',
    default_title: 'SMC Extension',
    default_icon: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png'
    }
  },
  icons: {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png'
  },
  web_accessible_resources: [
    {
      resources: ['src/content/content.ts', 'src/popup/popup.ts'],
      matches: ['<all_urls>']
    }
  ]
})
