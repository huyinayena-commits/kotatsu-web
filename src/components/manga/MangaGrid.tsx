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
            className={`grid gap-4 ${className}`}
            style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            }}
        >
            {children}
        </div>
    );
}
