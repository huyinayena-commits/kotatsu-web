'use client';

import React, { useRef, useEffect } from 'react';
import Lenis from 'lenis';

interface ScrollableContainerProps {
    children: React.ReactNode;
    height?: string;
    className?: string;
}

export default function ScrollableContainer({
    children,
    height = '400px',
    className = ''
}: ScrollableContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Initialize Lenis on the container
        const lenis = new Lenis({
            wrapper: container, // The element to make scrollable
            content: container.firstElementChild as HTMLElement, // The content wrapper
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Default Lenis easing
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
        });

        lenisRef.current = lenis;

        // RAF loop
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        const rafId = requestAnimationFrame(raf);

        // Prevent scroll chaining to parent window
        // Lenis doesn't automatically stop propagation to window when reaching bounds
        // unless we handle the wheel event ourselves or use overscroll-behavior (which we do in CSS)
        // But for Lenis specific event handling:

        return () => {
            lenis.destroy();
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: var(--border-default);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: var(--text-muted);
                }
            `}</style>
            <div
                ref={containerRef}
                className={`${className} custom-scrollbar`}
                style={{
                    height,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    position: 'relative',
                    overscrollBehavior: 'contain', // CSS prevention for chaining
                }}
            >
                {/* Wrapper div for Lenis content targeting if needed, though direct children works usually */}
                <div className="min-h-full">
                    {children}
                </div>
            </div>
        </>
    );
}
