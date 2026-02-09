'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/auth-context'
import { Spinner } from 'react-bootstrap'

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const hasRedirected = useRef(false)

    useEffect(() => {
        // Only redirect once to prevent loops
        if (!loading && !user && !hasRedirected.current) {
            hasRedirected.current = true
            router.push('/authentication/sign-in')
        }
    }, [user, loading, router])

    // Minimal loading indicator
    if (loading) {
        return (
            <div style={{ 
                position: 'fixed', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)'
            }}>
                <Spinner animation="border" variant="primary" size="sm" />
            </div>
        )
    }

    // Don't render anything if no user (redirect is happening)
    if (!user) {
        return null
    }

    return <>{children}</>
}
