import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const BASE_URL = "https://id.mgkomik.cc";

function generateRandomString(length: number): string {
    const charset = "HALOGaES.BCDFHIJKMNPQRTUVWXYZ.bcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
}

function getHeaders(): HeadersInit {
    return {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': BASE_URL,
        'X-Requested-With': generateRandomString(15),
    };
}

interface Params {
    params: Promise<{ chapterId: string }>;
}

export async function GET(request: Request, { params }: Params) {
    const { chapterId } = await params;
    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get('manga') || '';

    try {
        // Madara chapter URL pattern: /komik/{manga-slug}/{chapter-slug}/
        const url = mangaId
            ? `${BASE_URL}/komik/${mangaId}/${chapterId}/`
            : `${BASE_URL}/${chapterId}/`;

        const response = await fetch(url, {
            headers: getHeaders(),
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch chapter: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Get manga info from chapter page
        const mangaTitle = $('.rate-title, .breadcrumb li').eq(-2).text().trim() || 'Unknown';
        const $mangaLink = $('ol.breadcrumb li a').eq(-2);
        const mangaHref = $mangaLink.attr('href') || '';
        const derivedMangaId = mangaHref.split('/').filter(Boolean).pop() || mangaId;

        // Get chapter info
        const chapterTitle = $('h1, .chapter-heading').first().text().trim();
        const numMatch = chapterTitle.match(/chapter\s*(\d+(?:\.\d+)?)/i);
        const chapterNumber = numMatch ? parseFloat(numMatch[1]) : 1;

        // Get page images
        const pages: PageData[] = [];

        // Madara uses various image containers
        $('.reading-content img, .page-break img, .wp-manga-chapter-img').each((index, el) => {
            const $img = $(el);
            let imgUrl = $img.attr('data-src') || $img.attr('src') || '';

            // Clean URL
            imgUrl = imgUrl.trim();
            if (!imgUrl || imgUrl.includes('loading') || imgUrl.includes('placeholder')) return;

            pages.push({
                index: pages.length,
                url: imgUrl,
            });
        });

        // Get prev/next chapter links
        const prevLink = $('.nav-previous a, .prev_page').first().attr('href') || '';
        const nextLink = $('.nav-next a, .next_page').first().attr('href') || '';

        const prevChapterId = prevLink ? prevLink.split('/').filter(Boolean).pop() || null : null;
        const nextChapterId = nextLink ? nextLink.split('/').filter(Boolean).pop() || null : null;

        // Get manga cover from page if available
        const mangaCover = $('.site-logo img, .breadcrumb-image img').first().attr('src') || '';

        const chapter: ChapterInfo = {
            id: chapterId,
            mangaId: derivedMangaId,
            mangaTitle,
            mangaCover,
            chapterNumber,
            chapterTitle,
            totalPages: pages.length,
            prevChapterId,
            nextChapterId,
        };

        return NextResponse.json({
            success: true,
            source: 'Mgkomik',
            chapter,
            pages,
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

interface PageData {
    index: number;
    url: string;
}

interface ChapterInfo {
    id: string;
    mangaId: string;
    mangaTitle: string;
    mangaCover: string;
    chapterNumber: number;
    chapterTitle: string;
    totalPages: number;
    prevChapterId: string | null;
    nextChapterId: string | null;
}
