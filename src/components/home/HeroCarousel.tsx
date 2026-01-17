'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Star, Calendar } from 'lucide-react';

interface HeroSlide {
    id: string;
    title: string;
    description: string;
    cover: string;
    banner?: string;
    source: string;
    rating?: number;
    status?: string;
}

export function HeroCarousel() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const response = await fetch('/api/featured/shinigami');
                const data = await response.json();

                if (data.success && data.data.length > 0) {
                    const mappedSlides: HeroSlide[] = data.data.map((item: { url: string; title: string; chapter: string; cover: string; rating: string }, index: number) => ({
                        id: item.url.split('/').filter(Boolean).pop() || `slide-${index}`,
                        title: item.title,
                        description: `Baca chapter terbaru ${item.chapter} sekarang!`,
                        cover: item.cover,
                        banner: item.cover,
                        source: 'shinigami',
                        rating: parseFloat(item.rating) || 0,
                        status: item.chapter
                    }));
                    setSlides(mappedSlides);
                }
            } catch (error) {
                console.error('Failed to load slider:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSlides();
    }, []);

    useEffect(() => {
        if (isHovering || slides.length === 0) return;

        timeoutRef.current = setTimeout(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentSlide, isHovering, slides.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    // Loading State
    if (loading) {
        return (
            <div className="relative w-full h-[300px] md:h-[400px] lg:h-[450px] rounded-3xl bg-[var(--bg-elevated)] animate-pulse mb-8 border border-[var(--border-default)] overflow-hidden">
                <div className="absolute bottom-10 left-10 space-y-4">
                    <div className="h-6 w-24 bg-[var(--bg-surface)] rounded-lg"></div>
                    <div className="h-12 w-80 bg-[var(--bg-surface)] rounded-lg"></div>
                    <div className="h-4 w-64 bg-[var(--bg-surface)] rounded-lg"></div>
                    <div className="h-12 w-40 bg-[var(--bg-surface)] rounded-lg mt-4"></div>
                </div>
            </div>
        );
    }

    // Empty State
    if (slides.length === 0) return null;

    return (
        <div
            className="relative w-full h-[300px] md:h-[400px] lg:h-[450px] rounded-3xl overflow-hidden group mb-8 shadow-2xl ring-1 ring-white/10"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onTouchStart={() => setIsHovering(true)}
            onTouchEnd={() => setTimeout(() => setIsHovering(false), 3000)}
        >
            {/* Slides */}
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                >
                    {/* Background Image */}
                    <div className="absolute inset-0 bg-black overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={slide.banner || slide.cover}
                            alt={slide.title}
                            className={`w-full h-full object-cover opacity-50 transition-transform duration-[10s] ease-linear ${index === currentSlide ? 'scale-110' : 'scale-100'
                                }`}
                        />
                        {/* Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E] via-[#0A0B0E]/70 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0E] via-[#0A0B0E]/50 to-transparent" />

                        {/* Glow Effect */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--accent-primary)] opacity-10 blur-[120px] rounded-full pointer-events-none" />
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-3/4 lg:w-2/3 flex flex-col gap-4 animate-fadeInUp">
                        {/* Badges */}
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/30 flex items-center gap-2">
                                <Star size={12} fill="currentColor" /> Featured
                            </div>
                            {slide.status && (
                                <div className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-black/70 text-white border border-white/10 backdrop-blur-md flex items-center gap-2">
                                    <Calendar size={12} /> {slide.status}
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] drop-shadow-2xl line-clamp-2 tracking-tight">
                            {slide.title}
                        </h2>

                        {/* Description */}
                        <p className="text-gray-300 text-sm md:text-base line-clamp-2 max-w-xl font-medium">
                            {slide.description}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mt-2">
                            <Link
                                href={`/manga/${slide.source}/${slide.id}`}
                                className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-white text-black hover:bg-gray-100 font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            >
                                <Play size={20} fill="currentColor" />
                                <span>Baca Sekarang</span>
                            </Link>

                            {slide.rating !== undefined && slide.rating > 0 && (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-white">
                                    <Star size={18} className="text-yellow-400" fill="currentColor" />
                                    <span className="font-bold text-lg">{slide.rating}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation Buttons */}
            <div className="absolute right-6 bottom-6 flex gap-3 z-20">
                <button
                    onClick={prevSlide}
                    className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={nextSlide}
                    className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90"
                    aria-label="Next slide"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Pagination Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-10 md:translate-x-0 z-20 flex gap-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className="p-3 -m-1 touch-manipulation touch-target"
                        aria-label={`Go to slide ${index + 1}`}
                    >
                        <span
                            className={`block transition-all duration-500 rounded-full h-2 ${index === currentSlide
                                ? 'w-10 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                                : 'w-2.5 bg-white/30'
                                }`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
