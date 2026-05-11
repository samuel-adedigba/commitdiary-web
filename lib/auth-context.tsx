'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
    user: any | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/auth/user', { cache: 'no-store' }).then(async (response) => {
            if (!response.ok) return null
            const payload = await response.json()
            return payload.user ?? null
        }).then((user) => {
            setUser(user)
            setLoading(false)
        }).catch(() => {
            setLoading(false)
        })
    }, [])

    const signOut = async () => {
        await fetch('/api/auth/sign-out', { method: 'POST' })
        setUser(null)
    }

    const value = {
        user,
        loading,
        signOut
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
