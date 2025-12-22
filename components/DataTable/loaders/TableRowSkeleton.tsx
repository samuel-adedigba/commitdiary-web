import React from 'react';
import Skeleton from '@/components/ui/Skeleton';
import Table from '@/components/ui/Table';
import type { SkeletonProps } from '@/components/ui/Skeleton';

const { Tr, Td } = Table;

type TableRowSkeletonProps = {
    columns?: number;
    rows?: number;
    avatarInColumns?: number[];
    avatarProps?: SkeletonProps;
}

const TableRowSkeleton = ({
    columns = 5,
    rows = 5,
    avatarInColumns = [],
    avatarProps
}: TableRowSkeletonProps) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <Tr key={rowIndex}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Td key={colIndex}>
                            <div className="d-flex align-items-center gap-2">
                                {avatarInColumns && avatarInColumns.includes(colIndex) && (
                                    <Skeleton variant="circle" {...avatarProps} />
                                )}
                                <Skeleton variant="text" />
                            </div>
                        </Td>
                    ))}
                </Tr>
            ))}
        </>
    );
};

export default TableRowSkeleton;
