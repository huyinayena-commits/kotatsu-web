import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const BASE_URL = "https://id.mgkomik.cc";

// Rotate User Agents
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

function getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getHeaders(): HeadersInit {
    return {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': getRandomUserAgent(),
        'Referer': BASE_URL,
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
    };
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                headers: getHeaders(),
                next: { revalidate: 60 },
            });

            if (response.ok) {
                return response;
            }

            if (response.status === 403) {
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
                continue;
            }

            lastError = new Error(`HTTP ${response.status}`);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        }
    }

    throw lastError || new Error('Failed after retries');
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

        const response = await fetchWithRetry(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Get manga info from chapter page
        const mangaTitle = $('.rate-title, .breadcrumb li, .allc a').eq(-2).text().trim() ||
            $('ol.breadcrumb li').eq(-2).text().trim() ||
            'Unknown';
        const $mangaLink = $('ol.breadcrumb li a, .allc a').eq(-2);
        const mangaHref = $mangaLink.attr('href') || '';
        const derivedMangaId = mangaHref.split('/').filter(Boolean).pop() || mangaId;

        // Get chapter info
        const chapterTitle = $('h1, .entry-title, .chapter-heading').first().text().trim();
        const numMatch = chapterTitle.match(/chapter\s*(\d+(?:\.\d+)?)/i) ||
            chapterTitle.match(/ch\.?\s*(\d+(?:\.\d+)?)/i);
        const chapterNumber = numMatch ? parseFloat(numMatch[1]) : 1;

        // Get page images
        const pages: PageData[] = [];

        // Madara uses various image containers
        const imageSelectors = [
            '.reading-content img',
            '.page-break img',
            '.wp-manga-chapter-img',
            '#readerarea img',
            '.ts-main-image',
            '.size-full',
        ];

        for (const selector of imageSelectors) {
            $(selector).each((_, el) => {
                const $img = $(el);
                let imgUrl = $img.attr('data-src') ||
                    $img.attr('data-lazy-src') ||
                    $img.attr('data-cfsrc') ||
                    $img.attr('src') || '';

                // Clean URL
                imgUrl = imgUrl.trim();
                if (!imgUrl || imgUrl.includes('loading') || imgUrl.includes('placeholder') || imgUrl.includes('data:')) return;

                // Avoid duplicates
                if (pages.some(p => p.url === imgUrl)) return;

                pages.push({
                    index: pages.length,
                    url: imgUrl,
                });
            });

            if (pages.length > 0) break;
        }

        // Get prev/next chapter links
        const prevLink = $('.nav-previous a, .prev_page, .ch-prev-btn').first().attr('href') || '';
        const nextLink = $('.nav-next a, .next_page, .ch-next-btn').first().attr('href') || '';

        const prevChapterId = prevLink ? prevLink.split('/').filter(Boolean).pop() || null : null;
        const nextChapterId = nextLink ? nextLink.split('/').filter(Boolean).pop() || null : null;

        // Get manga cover from page if available
        const mangaCover = $('.site-logo img, .breadcrumb-image img, .thumb img').first().attr('src') || '';

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
            {
                success: false,
                error: message,
                hint: 'Source mungkin sedang diblokir atau down. Coba gunakan VPN.'
            },
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
