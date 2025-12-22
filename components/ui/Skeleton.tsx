import React from 'react'
import classNames from 'classnames'

export interface SkeletonProps extends React.ComponentPropsWithoutRef<'div'> {
    variant?: 'text' | 'circle' | 'rect'
    width?: string | number
    height?: string | number
    animation?: 'pulse' | 'wave' | false
}

const Skeleton = (props: SkeletonProps) => {
    const {
        variant = 'text',
        width,
        height,
        animation = 'pulse',
        className,
        style,
        ...rest
    } = props

    const skeletonClass = classNames(
        'skeleton',
        variant === 'circle' && 'rounded-circle',
        variant === 'rect' && 'rounded',
        animation === 'pulse' && 'skeleton-pulse',
        animation === 'wave' && 'skeleton-wave',
        className
    )

    const skeletonStyle = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1em' : variant === 'circle' ? '40px' : '100px'),
        backgroundColor: '#e9ecef',
        ...style
    }

    return (
        <div className={skeletonClass} style={skeletonStyle} {...rest} />
    )
}

export default Skeleton
