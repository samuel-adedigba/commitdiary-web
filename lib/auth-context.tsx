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
            setUser(payload.user ?? null)
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
