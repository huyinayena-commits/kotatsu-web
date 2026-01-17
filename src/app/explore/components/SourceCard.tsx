import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, Ban, Wrench, ExternalLink } from 'lucide-react';

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
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active':
                return {
                    bg: 'rgba(34, 197, 94, 0.1)',
                    color: '#22c55e',
                    border: 'rgba(34, 197, 94, 0.2)',
                    icon: <CheckCircle2 size={12} />,
                    label: 'Aktif',
                    glow: 'rgba(34, 197, 94, 0.4)',
                    pulse: true
                };
            case 'timeout':
                return {
                    bg: 'rgba(249, 115, 22, 0.1)',
                    color: '#f97316',
                    border: 'rgba(249, 115, 22, 0.2)',
                    icon: <Clock size={12} />,
                    label: 'Timeout',
                    glow: 'rgba(249, 115, 22, 0.3)',
                    pulse: false
                };
            case 'blocked':
                return {
                    bg: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: 'rgba(239, 68, 68, 0.2)',
                    icon: <Ban size={12} />,
                    label: 'Diblokir',
                    glow: 'rgba(239, 68, 68, 0.3)',
                    pulse: false
                };
            case 'maintenance':
                return {
                    bg: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    border: 'rgba(59, 130, 246, 0.2)',
                    icon: <Wrench size={12} />,
                    label: 'Maintenance',
                    glow: 'rgba(59, 130, 246, 0.3)',
                    pulse: false
                };
            default:
                return {
                    bg: 'var(--bg-surface)',
                    color: 'var(--text-muted)',
                    border: 'var(--border-default)',
                    icon: null,
                    label: status,
                    glow: 'transparent',
                    pulse: false
                };
        }
    };

    const statusConfig = getStatusConfig(source.status);

    const renderIcon = () => {
        if (!source.icon.startsWith('http')) {
            return (
                <div className="flex items-center justify-center text-4xl select-none">
                    {source.icon}
                </div>
            );
        }
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={source.icon}
                alt={source.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://www.google.com/s2/favicons?domain=${source.baseUrl}&sz=128`;
                }}
            />
        );
    };

    if (viewMode === 'grid') {
        return (
            <Link
                href={`/source/${source.id}`}
                className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    animationDelay: `${index * 50}ms`
                }}
            >
                {/* Hover Gradient Border Effect */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
                    style={{
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--kotatsu-secondary))',
                        padding: '1px',
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        maskComposite: 'xor',
                        WebkitMaskComposite: 'xor'
                    }}
                />

                {/* Content */}
                <div className="relative p-5 flex flex-col h-full">
                    {/* Header: Icon + Status */}
                    <div className="flex items-start justify-between mb-4">
                        {/* Icon with glow */}
                        <div className="relative">
                            <div
                                className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity"
                                style={{ background: statusConfig.glow }}
                            />
                            <div className="relative w-14 h-14 rounded-2xl bg-white p-2 shadow-md ring-1 ring-black/5">
                                {renderIcon()}
                            </div>
                            {/* Status dot */}
                            {source.status === 'active' && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[var(--bg-surface)] flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                </div>
                            )}
                        </div>

                        {/* Status Badge */}
                        <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border"
                            style={{
                                background: statusConfig.bg,
                                color: statusConfig.color,
                                borderColor: statusConfig.border
                            }}
                        >
                            {statusConfig.icon}
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold mb-1 text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                        {source.name}
                    </h3>

                    {/* URL */}
                    <p className="text-xs text-[var(--text-muted)] mb-3 font-mono truncate flex items-center gap-1">
                        <ExternalLink size={10} />
                        {source.baseUrl}
                    </p>

                    {/* Description */}
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed flex-grow">
                        {source.description}
                    </p>

                    {/* Footer: Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                        <span className="text-[10px] px-2 py-1 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium">
                            {source.language}
                        </span>
                        {source.genres.slice(0, 2).map(genre => (
                            <span
                                key={genre}
                                className="text-[10px] px-2 py-1 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]"
                            >
                                {genre}
                            </span>
                        ))}
                        {source.genres.length > 2 && (
                            <span className="text-[10px] px-2 py-1 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                                +{source.genres.length - 2}
                            </span>
                        )}
                    </div>

                    {/* Hover Arrow Indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                        <ArrowRight size={18} className="text-[var(--accent-primary)]" />
                    </div>
                </div>
            </Link>
        );
    }

    // List View
    return (
        <Link
            href={`/source/${source.id}`}
            className="group flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-default)]"
            style={{
                background: 'var(--bg-surface)',
                animationDelay: `${index * 30}ms`
            }}
        >
            {/* Icon */}
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
                    {renderIcon()}
                </div>
                {/* Status indicator dot */}
                <div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-surface)]"
                    style={{ background: statusConfig.color }}
                />
            </div>

            {/* Info */}
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                        {source.name}
                    </h3>
                    <span
                        className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1"
                        style={{
                            background: statusConfig.bg,
                            color: statusConfig.color,
                            borderColor: statusConfig.border
                        }}
                    >
                        {statusConfig.label}
                    </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                    {source.description}
                </p>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)] hidden sm:block">
                    {source.language}
                </span>
                <ArrowRight
                    size={18}
                    className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all"
                />
            </div>
        </Link>
    );
}
