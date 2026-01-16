import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface FeaturedManga {
    title: string;
    cover: string;
    chapter: string;
    rating: string;
    url: string;
    type?: string;
}

export async function GET() {
    try {
        const response = await fetch('https://shinigami.asia/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch shinigami: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const featured: FeaturedManga[] = [];

        // Target: Slider Section (biasanya class .slider atau .swiper-slide di homepage theme manga)
        // Analisis umum theme Shinigami (Madara/Mangastream based):

        // Coba selector 1: Slider item umum
        $('.slide-item, .swiper-slide .item-det').each((i, el) => {
            if (featured.length >= 6) return;

            const $el = $(el);
            // Title
            let title = $el.find('.post-title a, h2 a, h3 a').text().trim();
            if (!title) title = $el.find('.manga-title-in-slider').text().trim();

            // Url
            const url = $el.find('a').attr('href') || '';

            // Cover
            let cover = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';
            // Fix lazy load images
            if (cover.includes('data:image')) {
                cover = $el.find('img').attr('data-lazy-src') || $el.find('img').attr('data-src') || '';
            }

            // Rating
            const rating = $el.find('.rating .score, .post-total-rating .score').text().trim() || '0';

            // Chapter
            const chapter = $el.find('.chapter-item:first a, .latest-chapter:first').text().trim() || 'Ch. 1';

            if (title && url && cover) {
                featured.push({
                    title,
                    cover,
                    url,
                    rating,
                    chapter,
                    type: 'Manga'
                });
            }
        });

        // Fallback: Jika slider kosong (mungkin ganti theme/selector), ambil dari "Project Utama" atau "Popular"
        if (featured.length === 0) {
            $('.item-summary, .page-item-detail.manga').each((i, el) => {
                if (featured.length >= 5) return;
                const $el = $(el);
                const title = $el.find('.post-title h3 a, .post-title a').text().trim();
                const url = $el.find('.post-title h3 a, .post-title a').attr('href') || '';
                let cover = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';

                if (cover.includes('data:image')) {
                    cover = $el.find('img').attr('data-src') || '';
                }

                const rating = $el.find('.score, .rating').text().trim() || '0';

                if (title && url) {
                    featured.push({
                        title,
                        cover,
                        url,
                        rating,
                        chapter: 'Latest',
                        type: 'Popular'
                    });
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: featured,
            source: 'shinigami'
        });

    } catch (error) {
        console.error('Error scraping featured manga:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch featured manga',
            data: []
        }, { status: 500 });
    }
}
