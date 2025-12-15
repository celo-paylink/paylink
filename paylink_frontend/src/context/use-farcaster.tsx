import { useEffect, useState } from 'react'
import { sdk, getFarcasterContext, isFarcasterEnvironment } from '../libs/farcaster-sdk'

export interface FarcasterContext {
    isInFarcaster: boolean
    user: {
        fid?: number
        username?: string
        displayName?: string
        pfpUrl?: string
    } | null
    client: {
        clientFid?: number
        added?: boolean
    } | null
}

/**
 * Hook to access Farcaster context and utilities
 * Returns information about whether the app is running in Farcaster
 * and provides access to user and client information
 */
export function useFarcaster(): FarcasterContext {
    const [context, setContext] = useState<FarcasterContext>({
        isInFarcaster: false,
        user: null,
        client: null,
    })

    useEffect(() => {
        const loadContext = async () => {
            const isInFarcaster = isFarcasterEnvironment()

            if (isInFarcaster) {
                const farcasterContext = await getFarcasterContext()

                setContext({
                    isInFarcaster: true,
                    user: farcasterContext?.user || null,
                    client: farcasterContext?.client || null,
                })
            } else {
                setContext({
                    isInFarcaster: false,
                    user: null,
                    client: null,
                })
            }
        }

        loadContext()
    }, [])

    return context
}

/**
 * Utility functions for Farcaster actions
 */
export const farcasterActions = {
    /**
     * Open the compose cast dialog
     */
    composeCast: async (text?: string, embeds?: string[]) => {
        try {
            // SDK only supports up to 2 embeds
            const validEmbeds = embeds?.slice(0, 2) as [] | [string] | [string, string] | undefined
            await sdk.actions.composeCast({
                text,
                embeds: validEmbeds,
            })
        } catch (error) {
            console.error('[Farcaster] Failed to compose cast:', error)
        }
    },

    /**
     * Close the mini app
     */
    close: async () => {
        try {
            await sdk.actions.close()
        } catch (error) {
            console.error('[Farcaster] Failed to close:', error)
        }
    },

    /**
     * Prompt user to add the mini app
     */
    addMiniApp: async () => {
        try {
            await sdk.actions.addMiniApp()
        } catch (error) {
            console.error('[Farcaster] Failed to add mini app:', error)
        }
    },

    /**
     * Open an external URL
     */
    openUrl: async (url: string) => {
        try {
            await sdk.actions.openUrl(url)
        } catch (error) {
            console.error('[Farcaster] Failed to open URL:', error)
        }
    },
}
