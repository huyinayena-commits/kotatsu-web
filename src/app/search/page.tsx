'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search,
    ChevronLeft,
    AlertCircle,
    SearchX,
    BookOpen,
    ImageOff,
    Loader2
} from 'lucide-react';

interface MangaItem {
    source: string;
    id: string;
    title: string;
    cover: string;
    status?: string;
    genres?: string[];
    authors?: string[];
}

interface APIResponse {
    success: boolean;
    query: string;
    count: number;
    data: MangaItem[];
    error?: string;
}

export default function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<MangaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Search dengan debounce 500ms
    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data: APIResponse = await response.json();

            if (data.success) {
                setResults(data.data);
            } else {
                setError(data.error || 'Gagal mencari');
                setResults([]);
            }
        } catch (err) {
            setError('Terjadi kesalahan saat mencari');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce handler
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        // Clear timer sebelumnya
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set timer baru - tunggu 500ms sebelum search
        debounceTimer.current = setTimeout(() => {
            if (value.trim()) {
                // Update URL tanpa reload
                router.replace(`/search?q=${encodeURIComponent(value)}`, { scroll: false });
                performSearch(value);
            } else {
                router.replace('/search', { scroll: false });
                setResults([]);
                setSearched(false);
            }
        }, 500);
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    // Search dari URL parameter saat load
    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery);
        }
    }, [initialQuery, performSearch]);

    // Handle enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && query.trim()) {
            // Clear debounce dan langsung search
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
            performSearch(query);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/80 border-b border-purple-500/20">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                            <ChevronLeft size={20} /> Kembali
                        </Link>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                            Pencarian
                        </h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Search Input */}
                <div className="max-w-2xl mx-auto mb-8 animate-fadeIn">
                    <div className="relative group">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Cari manga... (contoh: One Piece, Naruto)"
                            className="w-full px-6 py-4 pl-14 bg-slate-800/50 border border-slate-700 rounded-2xl 
                                     text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 
                                     focus:ring-2 focus:ring-purple-500/20 transition-all text-lg shadow-lg group-hover:shadow-purple-500/10"
                        />
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors">
                            <Search size={24} />
                        </span>
                        {loading && (
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-purple-400">
                                <Loader2 size={24} className="animate-spin" />
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 text-sm mt-2 text-center">
                        Ketik minimal 2 karakter, pencarian otomatis setelah 0.5 detik
                    </p>
                </div>

                {/* Results */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center max-w-2xl mx-auto animate-scaleIn">
                        <AlertCircle className="mx-auto mb-2 text-red-400" size={32} />
                        <p className="text-red-400 font-medium">{error}</p>
                    </div>
                )}

                {!loading && searched && results.length === 0 && !error && (
                    <div className="text-center py-12 animate-fadeIn">
                        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                            <SearchX size={40} className="text-slate-500" />
                        </div>
                        <p className="text-slate-400 text-lg">
                            Tidak ditemukan hasil untuk "<span className="text-purple-400">{query}</span>"
                        </p>
                        <p className="text-slate-500 text-sm mt-2">
                            Coba kata kunci lain atau periksa ejaan
                        </p>
                    </div>
                )}

                {!searched && !loading && (
                    <div className="text-center py-12 animate-fadeIn">
                        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                            <BookOpen size={40} className="text-slate-500" />
                        </div>
                        <p className="text-slate-400 text-lg">Ketik judul manga yang ingin dicari</p>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="animate-fadeInUp">
                        <p className="text-slate-400 mb-6 text-center">
                            Ditemukan <span className="text-purple-400 font-semibold">{results.length}</span> hasil
                            untuk "<span className="text-pink-400">{query}</span>"
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {results.map((manga, index) => (
                                <Link
                                    key={manga.id}
                                    href={`/manga/shinigami/${manga.id}`}
                                    className="group relative rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50 
                                              hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10
                                              hover:-translate-y-1 animate-fadeInUp"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Cover */}
                                    <div className="aspect-[3/4] bg-slate-700 overflow-hidden relative">
                                        {manga.cover ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={manga.cover}
                                                alt={manga.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-600" style={{ display: manga.cover ? 'none' : 'flex' }}>
                                            <ImageOff size={32} />
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    {manga.status && (
                                        <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-lg backdrop-blur-sm
                                            ${manga.status === 'Ongoing' ? 'bg-green-500/80 text-white' :
                                                manga.status === 'Completed' ? 'bg-blue-500/80 text-white' :
                                                    'bg-yellow-500/80 text-black'}`}>
                                            {manga.status}
                                        </span>
                                    )}

                                    {/* Title */}
                                    <div className="p-3">
                                        <h3 className="text-sm font-medium text-slate-200 line-clamp-2 group-hover:text-purple-300 transition-colors">
                                            {manga.title}
                                        </h3>
                                        {manga.genres && manga.genres.length > 0 && (
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                {manga.genres.slice(0, 2).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-6 mt-12 animate-fadeIn">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-slate-500 text-sm">
                        Kotatsu Web Clone • Pencarian powered by Shinigami
                    </p>
                </div>
            </footer>
        </div>
    );
}
