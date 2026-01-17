
interface UpdateFiltersProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    counts: {
        all: number;
        unread: number;
    };
}

export function UpdateFilters({ activeFilter, onFilterChange, counts }: UpdateFiltersProps) {
    const filters = [
        { id: 'all', label: 'Semua', count: counts.all },
        { id: 'unread', label: 'Belum Dibaca', count: counts.unread },
    ];

    return (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
            {filters.map((filter) => (
                <button
                    key={filter.id}
                    onClick={() => onFilterChange(filter.id)}
                    className={`
                        px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
                        ${activeFilter === filter.id
                            ? 'bg-[var(--accent-primary)] text-[var(--kotatsu-on-primary)] shadow-lg shadow-[var(--accent-primary)]/20'
                            : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--accent-primary)]'
                        }
                    `}
                >
                    {filter.label}
                    <span className={`ml-2 text-xs opacity-80 ${activeFilter === filter.id ? '' : 'text-[var(--text-muted)]'}`}>
                        {filter.count}
                    </span>
                </button>
            ))}
        </div>
    );
}
