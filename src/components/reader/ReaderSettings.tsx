'use client';

import { Settings, ScrollText, BookOpen, Keyboard, ArrowLeft, ArrowRight, X, Mouse } from 'lucide-react';

type ReaderMode = 'webtoon' | 'pager';

interface ReaderSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    mode: ReaderMode;
    onModeChange: (mode: ReaderMode) => void;
    scrollSpeed?: number;
    onScrollSpeedChange?: (speed: number) => void;
}

export default function ReaderSettings({
    isOpen,
    onClose,
    mode,
    onModeChange,
    scrollSpeed = 2,
    onScrollSpeedChange,
}: ReaderSettingsProps) {
    if (!isOpen) return null;

    const speedLabels = ['1x', '1.5x', '2x', '2.5x', '3x', '4x', '5x'];
    const speedValues = [1, 1.5, 2, 2.5, 3, 4, 5];
    const currentSpeedIndex = speedValues.indexOf(scrollSpeed) !== -1 ? speedValues.indexOf(scrollSpeed) : 2;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[100]"
                style={{ background: 'var(--bg-overlay)' }}
                onClick={onClose}
            />

            {/* Settings Sheet */}
            <div
                className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-2xl p-6 animate-slideUp overflow-y-auto"
                style={{
                    background: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-default)',
                    maxHeight: '70vh',
                }}
            >
                {/* Handle */}
                <div className="flex justify-center mb-4">
                    <div
                        className="w-10 h-1 rounded-full"
                        style={{ background: 'var(--border-default)' }}
                    />
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h3
                        className="text-lg font-bold flex items-center gap-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        <Settings size={20} /> Pengaturan Reader
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/5"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Reading Mode */}
                <div className="mb-6">
                    <label
                        className="block text-sm mb-3 font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        Mode Baca
                    </label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => onModeChange('webtoon')}
                            className="flex-1 py-3 px-4 rounded-xl font-medium transition-all flex flex-col items-center gap-1"
                            style={{
                                background: mode === 'webtoon' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                                color: mode === 'webtoon' ? 'white' : 'var(--text-secondary)',
                                border: `1px solid ${mode === 'webtoon' ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <ScrollText size={18} /> Webtoon
                            </div>
                            <p className="text-xs opacity-70 font-normal">Scroll vertikal</p>
                        </button>
                        <button
                            onClick={() => onModeChange('pager')}
                            className="flex-1 py-3 px-4 rounded-xl font-medium transition-all flex flex-col items-center gap-1"
                            style={{
                                background: mode === 'pager' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                                color: mode === 'pager' ? 'white' : 'var(--text-secondary)',
                                border: `1px solid ${mode === 'pager' ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <BookOpen size={18} /> Pager
                            </div>
                            <p className="text-xs opacity-70 font-normal">Swipe horizontal</p>
                        </button>
                    </div>
                </div>

                {/* Scroll Speed - Only show in webtoon mode */}
                {mode === 'webtoon' && onScrollSpeedChange && (
                    <div className="mb-6">
                        <label
                            className="block text-sm mb-3 font-medium flex items-center gap-2"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <Mouse size={16} /> Kecepatan Scroll Wheel
                        </label>
                        <div
                            className="rounded-xl p-4"
                            style={{ background: 'var(--bg-surface)' }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Lambat</span>
                                <span
                                    className="text-lg font-bold px-3 py-1 rounded-lg"
                                    style={{
                                        color: 'var(--accent-primary)',
                                        background: 'var(--accent-primary-10)'
                                    }}
                                >
                                    {speedLabels[currentSpeedIndex]}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cepat</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max={speedValues.length - 1}
                                value={currentSpeedIndex}
                                onChange={(e) => onScrollSpeedChange(speedValues[parseInt(e.target.value)])}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, var(--accent-primary) ${(currentSpeedIndex / (speedValues.length - 1)) * 100}%, var(--bg-primary) ${(currentSpeedIndex / (speedValues.length - 1)) * 100}%)`,
                                }}
                            />
                            <div className="flex justify-between mt-2">
                                {speedLabels.map((label, i) => (
                                    <button
                                        key={label}
                                        onClick={() => onScrollSpeedChange(speedValues[i])}
                                        className="text-xs px-1 py-0.5 rounded transition-colors"
                                        style={{
                                            color: i === currentSpeedIndex ? 'var(--accent-primary)' : 'var(--text-muted)',
                                            fontWeight: i === currentSpeedIndex ? 600 : 400,
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Keyboard Shortcuts */}
                <div
                    className="rounded-xl p-4 mb-4"
                    style={{ background: 'var(--bg-surface)' }}
                >
                    <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Keyboard size={16} /> Keyboard Shortcuts
                    </p>
                    <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded border border-gray-600 bg-gray-800 font-mono flex items-center justify-center min-w-[20px]"><ArrowLeft size={10} /></span>
                            <span>/</span>
                            <span className="px-1.5 py-0.5 rounded border border-gray-600 bg-gray-800 font-mono flex items-center justify-center min-w-[20px]">A</span>
                            <span>- Halaman sebelumnya</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded border border-gray-600 bg-gray-800 font-mono flex items-center justify-center min-w-[20px]"><ArrowRight size={10} /></span>
                            <span>/</span>
                            <span className="px-1.5 py-0.5 rounded border border-gray-600 bg-gray-800 font-mono flex items-center justify-center min-w-[20px]">D</span>
                            <span>- Halaman berikutnya</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded border border-gray-600 bg-gray-800 font-mono">Tap Tengah</span>
                            <span>- Tampil/sembunyikan kontrol</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
