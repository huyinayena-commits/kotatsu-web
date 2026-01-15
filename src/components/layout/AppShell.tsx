'use client';

import { ReactNode } from 'react';
import BottomNavigation from './BottomNavigation';
import Sidebar from './Sidebar';

interface AppShellProps {
    children: ReactNode;
    badges?: { [key: string]: number };
}

export default function AppShell({ children, badges = {} }: AppShellProps) {
    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Sidebar - Desktop only */}
            <Sidebar badges={badges} />

            {/* Main Content */}
            <main
                className="main-content min-h-screen"
                style={{ background: 'var(--bg-primary)' }}
            >
                {children}
            </main>

            {/* Bottom Navigation - Mobile only */}
            <BottomNavigation badges={badges} />
        </div>
    );
}
