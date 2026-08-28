'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { httpRequest } from './httpClient'

interface AuthContextType {
    user: any | null
    loading: boolean
    signOut: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshUser = async () => {
        try {
            const response = await httpRequest('/api/auth/user', { cache: 'no-store' })
            if (!response.ok) {
                setUser(null)
                return
            }
            const payload = await response.json<{ user?: unknown }>()
            const identity = payload.user ?? null
            if (!identity) {
                setUser(null)
                return
            }

            // The API database owns application roles; Auth metadata is not an authority source.
            try {
                const profileResponse = await httpRequest('/v1/users/profile', { cache: 'no-store' })
                if (profileResponse.ok) {
                    const profile = await profileResponse.json<{ role?: string }>()
                    setUser({ ...(identity as object), role: profile.role === 'admin' ? 'admin' : 'user' })
                    return
                }
            } catch {
                // Keep the authenticated identity when the profile refresh is temporarily unavailable.
            }
            setUser({ ...(identity as object), role: 'user' })
        } catch {
            // Keep the current session state on transient refresh failures.
        }
    }

    useEffect(() => {
        refreshUser().then(() => {
            setLoading(false)
        }).catch(() => {
            setLoading(false)
        })
    }, [])

    const signOut = async () => {
        await httpRequest('/api/auth/sign-out', { method: 'POST' })
        setUser(null)
    }

    const value = {
        user,
        loading,
        signOut,
        refreshUser,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
