'use client';

import { ReactNode } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface MangaGridProps {
    children: ReactNode;
    variant?: 'grid' | 'list';
    className?: string;
}

export default function MangaGrid({
    children,
    variant = 'grid',
    className = '',
}: MangaGridProps) {
    const [parent] = useAutoAnimate();

    if (variant === 'list') {
        return (
            <div ref={parent} className={`flex flex-col gap-3 ${className}`}>
                {children}
            </div>
        );
    }

    return (
        <div
            ref={parent}
            className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 ${className}`}
        >
            {children}
        </div>
    );
}
