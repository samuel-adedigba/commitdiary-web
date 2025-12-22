'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../lib/auth-context'
import { Container, Spinner } from 'react-bootstrap'

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading && !user) {
            console.log('[AuthGuard] Not authenticated, redirecting to sign-in')
            router.push('/authentication/sign-in')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <Container className="d-flex align-items-center justify-content-center min-vh-100">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" className="mb-2" />
                    <p className="text-muted">Loading your session...</p>
                </div>
            </Container>
        )
    }

    if (!user) {
        return null
    }

    return <>{children}</>
}
