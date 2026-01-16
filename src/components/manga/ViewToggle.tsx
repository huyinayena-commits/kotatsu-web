'use client';

import { Grid, List } from 'lucide-react';

interface ViewToggleProps {
    view: 'grid' | 'list';
    onChange: (view: 'grid' | 'list') => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
    return (
        <div
            className="flex rounded-md overflow-hidden p-0.5 gap-0.5 flex-shrink-0"
            style={{
                background: 'var(--bg-elevated)',
            }}
        >
            <button
                onClick={() => onChange('grid')}
                className="p-1.5 transition-all rounded flex items-center justify-center"
                style={{
                    background: view === 'grid' ? 'var(--accent-primary)' : 'transparent',
                    color: view === 'grid' ? 'var(--kotatsu-on-primary)' : 'var(--text-muted)',
                }}
                title="Grid View"
            >
                <Grid size={16} />
            </button>
            <button
                onClick={() => onChange('list')}
                className="p-1.5 transition-all rounded flex items-center justify-center"
                style={{
                    background: view === 'list' ? 'var(--accent-primary)' : 'transparent',
                    color: view === 'list' ? 'var(--kotatsu-on-primary)' : 'var(--text-muted)',
                }}
                title="List View"
            >
                <List size={16} />
            </button>
        </div>
    );
}
