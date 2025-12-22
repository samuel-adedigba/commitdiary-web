import React from 'react'
import { Pagination as BSPagination } from 'react-bootstrap'

export interface PaginationProps {
    total: number
    currentPage: number
    pageSize: number
    onChange: (page: number) => void
    className?: string
}

const Pagination = (props: PaginationProps) => {
    const {
        total,
        currentPage,
        pageSize,
        onChange,
        className
    } = props

    const totalPages = Math.ceil(total / pageSize)

    console.log('[Pagination] total:', total, 'pageSize:', pageSize, 'totalPages:', totalPages, 'currentPage:', currentPage)

    // Show pagination if there are any items
    if (total === 0) return null

    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxVisible = 7

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i)
                pages.push('...')
                pages.push(totalPages)
            } else if (currentPage >= totalPages - 3) {
                pages.push(1)
                pages.push('...')
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
            } else {
                pages.push(1)
                pages.push('...')
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
                pages.push('...')
                pages.push(totalPages)
            }
        }

        return pages
    }

    return (
        <BSPagination className={className}>
            <BSPagination.First 
                onClick={() => onChange(1)} 
                disabled={currentPage === 1}
            />
            <BSPagination.Prev 
                onClick={() => onChange(currentPage - 1)} 
                disabled={currentPage === 1}
            />
            
            {getPageNumbers().map((page, index) => {
                if (page === '...') {
                    return <BSPagination.Ellipsis key={`ellipsis-${index}`} disabled />
                }
                return (
                    <BSPagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => onChange(page as number)}
                    >
                        {page}
                    </BSPagination.Item>
                )
            })}

            <BSPagination.Next 
                onClick={() => onChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
            />
            <BSPagination.Last 
                onClick={() => onChange(totalPages)} 
                disabled={currentPage === totalPages}
            />
        </BSPagination>
    )
}

export default Pagination
