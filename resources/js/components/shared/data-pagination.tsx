import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import type { PaginatedResponse } from '@/types';

interface DataPaginationProps<T> {
    data: PaginatedResponse<T>;
}

export default function DataPagination<T>({ data }: DataPaginationProps<T>) {
    if (data.last_page <= 1) return null;

    return (
        <Pagination>
            <PaginationContent>
                {/* Previous */}
                {data.links[0]?.url ? (
                    <PaginationItem>
                        <PaginationPrevious href={data.links[0].url} />
                    </PaginationItem>
                ) : (
                    <PaginationItem>
                        <PaginationPrevious href="#" className="pointer-events-none opacity-50" />
                    </PaginationItem>
                )}

                {/* Page Numbers */}
                {data.links.slice(1, -1).map((link, i) => (
                    <PaginationItem key={i}>
                        {link.label === '...' ? (
                            <PaginationEllipsis />
                        ) : (
                            <PaginationLink href={link.url ?? '#'} isActive={link.active}>
                                {link.label}
                            </PaginationLink>
                        )}
                    </PaginationItem>
                ))}

                {/* Next */}
                {data.links[data.links.length - 1]?.url ? (
                    <PaginationItem>
                        <PaginationNext href={data.links[data.links.length - 1].url!} />
                    </PaginationItem>
                ) : (
                    <PaginationItem>
                        <PaginationNext href="#" className="pointer-events-none opacity-50" />
                    </PaginationItem>
                )}
            </PaginationContent>
        </Pagination>
    );
}
