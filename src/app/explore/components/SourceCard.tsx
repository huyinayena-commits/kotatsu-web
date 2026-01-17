
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, Ban, Wrench } from 'lucide-react';

export interface SourceInfo {
    id: string;
    name: string;
    language: string;
    status: 'active' | 'timeout' | 'blocked' | 'maintenance';
    description: string;
    genres: string[];
    baseUrl: string;
    icon: string;
}

interface SourceCardProps {
    source: SourceInfo;
    viewMode: 'grid' | 'list';
    index: number;
}

export function SourceCard({ source, viewMode, index }: SourceCardProps) {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return { bg: 'rgba(129, 199, 132, 0.15)', color: '#4caf50', border: 'rgba(129, 199, 132, 0.3)' };
            case 'timeout': return { bg: 'rgba(251, 140, 0, 0.15)', color: '#ff9800', border: 'rgba(251, 140, 0, 0.3)' };
            case 'blocked': return { bg: 'rgba(255, 180, 169, 0.15)', color: '#f44336', border: 'rgba(255, 180, 169, 0.3)' };
            case 'maintenance': return { bg: 'rgba(171, 199, 255, 0.15)', color: 'var(--accent-primary)', border: 'rgba(171, 199, 255, 0.3)' };
            default: return { bg: 'var(--bg-surface)', color: 'var(--text-muted)', border: 'var(--border-default)' };
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle2 size={12} />;
            case 'timeout': return <Clock size={12} />;
            case 'blocked': return <Ban size={12} />;
            case 'maintenance': return <Wrench size={12} />;
            default: return null;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Aktif';
            case 'timeout': return 'Timeout';
            case 'blocked': return 'Diblokir';
            case 'maintenance': return 'Maintenance';
            default: return status;
        }
    };

    const renderIcon = (source: SourceInfo) => {
        if (!source.icon.startsWith('http')) {
            return <div className="w-12 h-12 flex items-center justify-center text-3xl select-none">{source.icon}</div>;
        }
        return (
            <div className={`
                ${viewMode === 'grid' ? 'w-16 h-16 mb-4' : 'w-10 h-10'} 
                rounded-2xl overflow-hidden flex items-center justify-center bg-white p-1.5 shadow-sm border border-gray-100 flex-shrink-0
            `}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={source.icon}
                    alt={source.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://www.google.com/s2/favicons?domain=${source.baseUrl}&sz=128`;
                    }}
                />
            </div>
        );
    };

    const statusStyle = getStatusStyle(source.status);

    if (viewMode === 'grid') {
        return (
            <Link
                href={`/source/${source.id}`}
                className="group relative flex flex-col items-center text-center p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[var(--accent-primary)] hover:shadow-[var(--accent-primary)]/10"
                style={{ animationDelay: `${index * 50}ms` }}
            >
                <div className="absolute top-3 right-3">
                    <span
                        className={`
                            px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1
                            border
                        `}
                        style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            borderColor: statusStyle.border
                        }}
                    >
                        {getStatusIcon(source.status)}
                        {getStatusLabel(source.status)}
                    </span>
                </div>

                {renderIcon(source)}

                <h3 className="text-lg font-bold mb-1 text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    {source.name}
                </h3>

                <p className="text-xs text-[var(--text-muted)] mb-3 font-mono bg-[var(--bg-elevated)] px-2 py-0.5 rounded">
                    {source.baseUrl}
                </p>

                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                    {source.description}
                </p>

                <div className="mt-auto flex flex-wrap justify-center gap-1.5">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                        {source.language}
                    </span>
                    {source.genres.slice(0, 2).map(genre => (
                        <span key={genre} className="text-[10px] px-2 py-1 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                            {genre}
                        </span>
                    ))}
                </div>
            </Link>
        );
    }

    // List View
    return (
        <Link
            href={`/source/${source.id}`}
            className="group flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] transition-all hover:bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)]"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {renderIcon(source)}

            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                        {source.name}
                    </h3>
                    <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1"
                        style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            borderColor: statusStyle.border
                        }}
                    >
                        {getStatusLabel(source.status)}
                    </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                    {source.description}
                </p>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] hidden sm:block">
                    {source.language}
                </span>
                <ArrowRight size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all" />
            </div>
        </Link>
    );
}
