'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Clock,
    Heart,
    Compass,
    Bell,
    Settings,
    Menu,
    ChevronLeft
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

interface SidebarProps {
    badges?: { [key: string]: number };
}

export default function Sidebar({ badges = {} }: SidebarProps) {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(false);

    // Close sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const sidebar = document.getElementById('desktop-sidebar');
            if (sidebar && !sidebar.contains(e.target as Node) && isExpanded) {
                setIsExpanded(false);
            }
        };

        if (isExpanded) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isExpanded]);

    // Close sidebar on route change
    useEffect(() => {
        setIsExpanded(false);
    }, [pathname]);

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    const toggleSidebar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <>
            {/* Overlay when expanded */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-40 hidden lg:block"
                    style={{ background: 'var(--bg-overlay)' }}
                    onClick={() => setIsExpanded(false)}
                />
            )}

            <aside
                id="desktop-sidebar"
                className="fixed left-0 top-0 bottom-0 z-50 hidden lg:flex flex-col transition-all duration-300 shadow-xl"
                style={{
                    width: isExpanded ? 'var(--sidebar-expanded)' : 'var(--sidebar-width)',
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border-default)',
                }}
            >
                {/* Hamburger Button / Logo */}
                <button
                    onClick={toggleSidebar}
                    className="group flex items-center justify-between px-4 py-4 border-b cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors relative"
                    style={{
                        height: '64px',
                        borderColor: 'var(--border-default)',
                    }}
                >
                    <div className="flex items-center gap-4 w-full">
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all group-hover:bg-[var(--bg-surface)] group-hover:shadow-sm">
                            <Menu
                                size={24}
                                className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:text-[var(--accent-primary)]"
                                style={{
                                    color: 'var(--text-primary)',
                                    transform: isExpanded ? 'rotate(90deg)' : 'none'
                                }}
                            />
                        </div>

                        {isExpanded && (
                            <span
                                className="font-bold text-lg whitespace-nowrap overflow-hidden animate-fadeIn"
                                style={{ color: 'var(--accent-primary)' }}
                            >
                                Kotatsu
                            </span>
                        )}
                    </div>

                    {isExpanded && (
                        <div className="absolute right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                            <ChevronLeft size={20} />
                        </div>
                    )}
                </button>

                {/* Navigation Items */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        const badge = badges[item.id];
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center px-3 py-3 mx-2 my-1 rounded-xl transition-all relative group overflow-hidden ${!active ? 'hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] hover:pl-4' : ''
                                    }`}
                                style={{
                                    background: active ? 'var(--kotatsu-primary-container)' : 'transparent',
                                    color: active ? 'var(--kotatsu-on-primary-container)' : 'var(--text-secondary)',
                                }}
                                title={!isExpanded ? item.label : undefined}
                            >
                                {/* Icon with badge */}
                                <div className="relative flex-shrink-0 w-8 flex justify-center">
                                    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                                    {badge && badge > 0 && (
                                        <span
                                            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full border-2 border-[var(--bg-secondary)]"
                                            style={{
                                                background: 'var(--accent-error)',
                                                color: 'white',
                                            }}
                                        >
                                            {badge > 99 ? '99+' : badge}
                                        </span>
                                    )}
                                </div>

                                {/* Label - only when expanded */}
                                <div
                                    className={`ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}
                                >
                                    {item.label}
                                </div>

                                {/* Hover tooltip for collapsed state */}
                                {!isExpanded && (
                                    <div
                                        className="absolute left-full ml-3 px-3 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap pointer-events-none z-50 text-sm font-medium"
                                        style={{
                                            background: 'var(--bg-elevated)',
                                            color: 'var(--text-primary)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                            border: '1px solid var(--border-subtle)',
                                        }}
                                    >
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Info */}
                <div
                    className="py-4 px-4 text-center border-t hidden lg:block"
                    style={{ borderColor: 'var(--border-default)' }}
                >
                    {isExpanded ? (
                        <p className="text-xs opacity-50">v0.1.0 Beta</p>
                    ) : (
                        <p className="text-xs opacity-50">v0.1</p>
                    )}
                </div>
            </aside>
        </>
    );
}
