'use client';

import Link from 'next/link';
import { Settings, ChevronLeft, Construction } from 'lucide-react';

export default function SettingsPage() {
    return (
        <main className="min-h-screen text-white pb-20 lg:pb-0" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <header
                className="sticky top-0 z-50 backdrop-blur-xl border-b"
                style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-default)'
                }}
            >
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <ChevronLeft size={20} /> Kembali
                        </Link>
                        <h1
                            className="text-xl font-bold flex items-center gap-2"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <Settings className="text-[var(--accent-primary)]" /> Pengaturan
                        </h1>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-16 max-w-md">
                {/* Coming Soon */}
                <div className="text-center animate-fadeIn">
                    <div
                        className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'var(--bg-elevated)' }}
                    >
                        <Construction size={48} className="text-[var(--accent-primary)]" />
                    </div>

                    <h2
                        className="text-2xl font-bold mb-3"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Coming Soon
                    </h2>

                    <p
                        className="text-sm mb-8"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        Fitur pengaturan sedang dalam pengembangan.
                        <br />
                        Nantikan update selanjutnya!
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
                        style={{
                            background: 'var(--accent-primary)',
                            color: 'var(--kotatsu-on-primary)'
                        }}
                    >
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </main>
    );
}
