/**
 * DataTable Usage Example
 * 
 * This shows how to use the DataTable component with your commits data
 */

import { useMemo } from 'react'
import DataTable, { ColumnDef } from './DataTable'

// Example for Commits Table
const CommitsDataTable = ({ commits, loading }) => {
    const columns: ColumnDef<any>[] = useMemo(() => [
        {
            header: 'Message',
            accessorKey: 'message',
            cell: ({ row }) => (
                <div className="text-truncate" style={{ maxWidth: 400 }}>
                    {row.original.message}
                </div>
            )
        },
        {
            header: 'Repository',
            accessorKey: 'repo_name',
        },
        {
            header: 'Author',
            accessorKey: 'author',
        },
        {
            header: 'Date',
            accessorKey: 'date',
            cell: ({ row }) => (
                <span>{new Date(row.original.date).toLocaleDateString()}</span>
            )
        },
        {
            header: 'Category',
            accessorKey: 'category',
            cell: ({ row }) => (
                <span className="badge bg-primary">{row.original.category || 'Uncategorized'}</span>
            )
        },
    ], [])

    return (
        <DataTable
            columns={columns}
            data={commits || []}
            loading={loading}
            noData={!commits || commits.length === 0}
            selectable={false}
            pagingData={{
                total: commits?.length || 0,
                pageIndex: 1,
                pageSize: 10
            }}
            onPaginationChange={(page) => {
                console.log('Page changed to:', page)
            }}
            onSelectChange={(size) => {
                console.log('Page size changed to:', size)
            }}
        />
    )
}

export default CommitsDataTable
