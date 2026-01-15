'use client';

import { Grid, List } from 'lucide-react';

interface ViewToggleProps {
    view: 'grid' | 'list';
    onChange: (view: 'grid' | 'list') => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
    return (
        <div
            className="flex rounded-lg overflow-hidden p-1 gap-1"
            style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
            }}
        >
            <button
                onClick={() => onChange('grid')}
                className="px-3 py-1.5 text-sm transition-all rounded-md flex items-center gap-2 hover:bg-[var(--bg-surface)]"
                style={{
                    background: view === 'grid' ? 'var(--accent-primary)' : 'transparent',
                    color: view === 'grid' ? 'var(--kotatsu-on-primary)' : 'var(--text-muted)',
                    boxShadow: view === 'grid' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
                title="Grid View"
            >
                <Grid size={18} />
                <span className="hidden sm:inline">Grid</span>
            </button>
            <button
                onClick={() => onChange('list')}
                className="px-3 py-1.5 text-sm transition-all rounded-md flex items-center gap-2 hover:bg-[var(--bg-surface)]"
                style={{
                    background: view === 'list' ? 'var(--accent-primary)' : 'transparent',
                    color: view === 'list' ? 'var(--kotatsu-on-primary)' : 'var(--text-muted)',
                    boxShadow: view === 'list' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
                title="List View"
            >
                <List size={18} />
                <span className="hidden sm:inline">List</span>
            </button>
        </div>
    );
}
