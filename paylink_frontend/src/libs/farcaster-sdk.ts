import { sdk } from '@farcaster/miniapp-sdk'

/**
 * Farcaster SDK singleton instance
 * Use this throughout the app to interact with Farcaster features
 */
export { sdk }

/**
 * Initialize the SDK and hide the splash screen
 * Call this after the app has fully loaded
 */
export async function initializeFarcasterSDK() {
  try {
    await sdk.actions.ready()
    console.log('[Farcaster] SDK initialized and splash screen hidden')
  } catch (error) {
    console.warn('[Farcaster] Failed to initialize SDK:', error)
    // Failing silently - app should work outside Farcaster
  }
}

/**
 * Check if the app is running inside a Farcaster client
 */
export function isFarcasterEnvironment(): boolean {
  try {
    return sdk.context !== null
  } catch {
    return false
  }
}

/**
 * Get the Farcaster context (user info, client info, etc.)
 * Returns null if not running in Farcaster
 */
export function getFarcasterContext() {
  try {
    return sdk.context
  } catch {
    return null
  }
}
