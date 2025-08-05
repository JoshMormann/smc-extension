import { ExtensionMessage, SaveSREFRequest } from '../types';
import { AuthService, SREFService } from '../shared/supabase';

/**
 * Background service worker for the SREF Mining Extension
 * Handles authentication, API calls, and message passing
 */

console.log('SREF Mining Extension background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details);
  
  if (details.reason === 'install') {
    // Set up initial extension state
    chrome.storage.local.set({
      isFirstTime: true,
      settings: {
        autoDetect: true,
        notifications: true,
      },
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((
  message: ExtensionMessage,
  sender,
  sendResponse
) => {
  console.log('Background received message:', message.type, message.data);

  switch (message.type) {
    case 'GET_AUTH_STATUS':
      handleGetAuthStatus(sendResponse);
      return true; // Keep message channel open for async response

    case 'SAVE_SREF':
      handleSaveSREF(message.data as SaveSREFRequest, sendResponse);
      return true; // Keep message channel open for async response

    case 'SREF_DETECTED':
      handleSREFDetected(message.data, sender);
      break;

    default:
      console.warn('Unknown message type:', message.type);
  }
});

/**
 * Handle authentication status requests
 */
async function handleGetAuthStatus(sendResponse: (response: any) => void) {
  try {
    const authState = await AuthService.getAuthState();
    sendResponse({ success: true, data: authState });
  } catch (error) {
    console.error('Failed to get auth status:', error);
    sendResponse({ success: false, error: 'Failed to get authentication status' });
  }
}

/**
 * Handle SREF save requests
 */
async function handleSaveSREF(
  request: SaveSREFRequest,
  sendResponse: (response: any) => void
) {
  try {
    const result = await SREFService.saveSREF({
      title: request.title,
      code_value: request.srefCode,
      sv_version: request.svVersion,
      images: request.images.map((url, index) => ({
        image_url: url,
        position: index,
      })),
      tags: request.tags,
    });

    if (result.success) {
      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'SREF Saved!',
        message: `"${request.title}" has been saved to your library.`,
      });

      sendResponse({ success: true, data: result.data });
    } else {
      sendResponse({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Failed to save SREF:', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save SREF' 
    });
  }
}

/**
 * Handle SREF detection events from content scripts
 */
function handleSREFDetected(data: any, sender: chrome.runtime.MessageSender) {
  console.log('SREF detected on page:', data, sender.tab?.url);
  
  // Store the detected SREF for popup access
  chrome.storage.local.set({
    lastDetectedSREF: {
      ...data,
      timestamp: Date.now(),
      tabId: sender.tab?.id,
      url: sender.tab?.url,
    },
  });

  // Show badge notification
  if (sender.tab?.id) {
    chrome.action.setBadgeText({
      text: '!',
      tabId: sender.tab.id,
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#4CAF50',
      tabId: sender.tab.id,
    });
  }
}

// Clear badge when tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});

// Handle auth changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.authState) {
    console.log('Auth state changed:', changes.authState.newValue);
  }
});