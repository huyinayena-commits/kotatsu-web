'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Clock,
    Heart,
    Compass,
    Bell,
    Settings
} from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    href: string;
    badge?: number;
}

const navItems: NavItem[] = [
    { id: 'history', label: 'History', icon: Clock, href: '/' },
    { id: 'favorites', label: 'Favorites', icon: Heart, href: '/library' },
    { id: 'explore', label: 'Explore', icon: Compass, href: '/explore' },
    { id: 'updates', label: 'Updates', icon: Bell, href: '/updates' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

interface BottomNavigationProps {
    badges?: { [key: string]: number };
}

export default function BottomNavigation({ badges = {} }: BottomNavigationProps) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden shadow-lg-up"
            style={{
                background: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-default)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            <div className="flex items-center justify-around" style={{ height: 'var(--nav-height)' }}>
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const badge = badges[item.id];
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="flex flex-col items-center justify-center flex-1 py-1 relative transition-all active:scale-95"
                            style={{
                                color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            }}
                        >
                            {/* Active indicator */}
                            {active && (
                                <div
                                    className="absolute top-1 rounded-full animate-scaleIn"
                                    style={{
                                        width: '48px',
                                        height: '28px',
                                        background: 'var(--kotatsu-primary-container)',
                                        borderRadius: 'var(--radius-full)',
                                        zIndex: 0
                                    }}
                                />
                            )}

                            {/* Icon with badge */}
                            <div className="relative z-10 mb-0.5">
                                <Icon
                                    size={20}
                                    strokeWidth={active ? 2.5 : 2}
                                    className="transition-all"
                                />
                                {badge && badge > 0 && (
                                    <span
                                        className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold rounded-full px-0.5 border border-[var(--bg-secondary)]"
                                        style={{
                                            background: 'var(--accent-error)',
                                            color: 'white',
                                        }}
                                    >
                                        {badge > 99 ? '99+' : badge}
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span
                                className="text-[10px] z-10 font-medium"
                                style={{
                                    color: active ? 'var(--kotatsu-on-surface-variant)' : 'var(--text-muted)',
                                    fontWeight: active ? 600 : 400
                                }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
