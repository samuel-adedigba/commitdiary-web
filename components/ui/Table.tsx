import React, { forwardRef } from 'react'
import { Table as BSTable } from 'react-bootstrap'
import { ChevronDown, ChevronUp } from 'react-feather'
import classNames from 'classnames'

export interface TableProps extends React.ComponentPropsWithoutRef<'table'> {
    hoverable?: boolean
    compact?: boolean
    asElement?: React.ElementType
}

const Table = forwardRef<HTMLTableElement, TableProps>((props, ref) => {
    const {
        children,
        className,
        hoverable = true,
        compact = false,
        asElement: Component = BSTable,
        ...rest
    } = props

    const tableClass = classNames(
        className,
        hoverable && 'table-hover',
        compact && 'table-sm'
    )

    return (
        <Component ref={ref} className={tableClass} {...rest}>
            {children}
        </Component>
    )
})

Table.displayName = 'Table'

const THead = forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<'thead'>>(
    (props, ref) => {
        const { children, className, ...rest } = props
        return (
            <thead ref={ref} className={className} {...rest}>
                {children}
            </thead>
        )
    }
)

THead.displayName = 'THead'

const TBody = forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<'tbody'>>(
    (props, ref) => {
        const { children, className, ...rest } = props
        return (
            <tbody ref={ref} className={className} {...rest}>
                {children}
            </tbody>
        )
    }
)

TBody.displayName = 'TBody'

const Tr = forwardRef<HTMLTableRowElement, React.ComponentPropsWithoutRef<'tr'>>(
    (props, ref) => {
        const { children, className, ...rest } = props
        return (
            <tr ref={ref} className={className} {...rest}>
                {children}
            </tr>
        )
    }
)

Tr.displayName = 'Tr'

const Th = forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<'th'>>(
    (props, ref) => {
        const { children, className, ...rest } = props
        return (
            <th ref={ref} className={className} {...rest}>
                {children}
            </th>
        )
    }
)

Th.displayName = 'Th'

const Td = forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<'td'>>(
    (props, ref) => {
        const { children, className, ...rest } = props
        return (
            <td ref={ref} className={className} {...rest}>
                {children}
            </td>
        )
    }
)

Td.displayName = 'Td'

interface SorterProps {
    sort?: boolean | 'asc' | 'desc'
}

const Sorter = ({ sort }: SorterProps) => {
    return (
        <span className="ms-2 d-inline-flex flex-column align-items-center">
            <ChevronUp 
                size={12} 
                className={classNames(
                    'mb-n1',
                    sort === 'asc' ? 'text-primary' : 'text-muted'
                )} 
            />
            <ChevronDown 
                size={12}
                className={classNames(
                    sort === 'desc' ? 'text-primary' : 'text-muted'
                )} 
            />
        </span>
    )
}

// Create a compound component with proper typing
type TableComponent = typeof Table & {
    THead: typeof THead
    TBody: typeof TBody
    Tr: typeof Tr
    Th: typeof Th
    Td: typeof Td
    Sorter: typeof Sorter
}

const TableWithSubComponents = Table as TableComponent
TableWithSubComponents.THead = THead
TableWithSubComponents.TBody = TBody
TableWithSubComponents.Tr = Tr
TableWithSubComponents.Th = Th
TableWithSubComponents.Td = Td
TableWithSubComponents.Sorter = Sorter

export { THead, TBody, Tr, Th, Td, Sorter }
export default TableWithSubComponents
