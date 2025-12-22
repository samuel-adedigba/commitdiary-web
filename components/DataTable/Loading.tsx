import React from 'react'
import { Spinner } from 'react-bootstrap'
import classNames from 'classnames'

interface LoadingProps {
    loading?: boolean
    children?: React.ReactNode
    type?: 'default' | 'cover'
    className?: string
}

const Loading = (props: LoadingProps) => {
    const {
        loading = false,
        children,
        type = 'default',
        className
    } = props

    if (!loading) {
        return <>{children}</>
    }

    if (type === 'cover') {
        return (
            <div className="position-relative">
                {children}
                <div 
                    className={classNames(
                        'position-absolute top-0 start-0 w-100 h-100',
                        'd-flex align-items-center justify-content-center',
                        'bg-white bg-opacity-75',
                        className
                    )}
                    style={{ zIndex: 10 }}
                >
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            </div>
        )
    }

    return (
        <div className={classNames('text-center p-4', className)}>
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>
        </div>
    )
}

export default Loading
