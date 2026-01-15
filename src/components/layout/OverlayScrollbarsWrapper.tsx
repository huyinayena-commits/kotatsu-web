'use client';

import { useEffect } from 'react';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { OverlayScrollbars } from 'overlayscrollbars';
import 'overlayscrollbars/styles/overlayscrollbars.css';

export default function OverlayScrollbarsWrapper({ children }: { children: React.ReactNode }) {
    const [initBodyOverlayScrollbars] = useOverlayScrollbars({
        defer: true,
        options: {
            scrollbars: {
                theme: 'os-theme-light', // We will customize this or use 'os-theme-dark' based on requirements
                autoHide: 'move',
                clickScroll: true,
            },
        },
    });

    useEffect(() => {
        // Initialize on body
        initBodyOverlayScrollbars(document.body);
    }, [initBodyOverlayScrollbars]);

    return <>{children}</>;
}
