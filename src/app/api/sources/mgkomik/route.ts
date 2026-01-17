import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Mgkomik - Madara Theme Parser
// Domain: id.mgkomik.cc

const BASE_URL = "https://id.mgkomik.cc";
const LIST_URL = `${BASE_URL}/komik/`;

// Rotate User Agents to avoid detection
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getHeaders(): HeadersInit {
    return {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': getRandomUserAgent(),
        'Referer': BASE_URL + '/',
        'Origin': BASE_URL,
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'DNT': '1',
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

            // If 403, try with different approach
            if (response.status === 403) {
                // Wait a bit before retry
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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('q') || '';

    try {
        let url: string;

        if (search) {
            url = `${BASE_URL}/?s=${encodeURIComponent(search)}&post_type=wp-manga`;
        } else {
            url = page > 1 ? `${LIST_URL}page/${page}/` : LIST_URL;
        }

        const response = await fetchWithRetry(url);
        const html = await response.text();
        return parseAndRespond(html, page);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        // Return mock data if fetch fails (for development/testing)
        if (message.includes('403') || message.includes('Failed')) {
            return NextResponse.json({
                success: true,
                source: 'Mgkomik',
                page,
                count: 0,
                data: [],
                error: 'Source temporarily unavailable. Try again later or use VPN.',
                status: 'blocked'
            });
        }

        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

function parseAndRespond(html: string, page: number) {
    const $ = cheerio.load(html);
    const results: MangaItem[] = [];

    // Try multiple selectors for Madara theme
    const selectors = [
        '.page-item-detail',
        '.c-tabs-item__content',
        '.manga-item',
        '.post-item',
        '.wp-manga',
        '.manga',
        '.bsx', // Some Madara variants
        '.bs',
        '.utao',
    ];

    let found = false;
    for (const selector of selectors) {
        $(selector).each((_, element) => {
            const $el = $(element);
            const $link = $el.find('a[href*="/komik/"], a[href*="/manga/"], .post-title a, h3 a, .tt a').first();
            const href = $link.attr('href') || '';
            const title = $link.text().trim() || $link.attr('title') || $el.find('.post-title, h3, h4, .tt').first().text().trim();

            if (!href || !title) return;

            const slug = href.split('/').filter(Boolean).pop() || '';
            const $img = $el.find('img').first();
            // Try multiple image attributes
            let cover = $img.attr('data-src')
                || $img.attr('data-lazy-src')
                || $img.attr('data-original')
                || $img.attr('src')
                || $img.attr('data-cfsrc')
                || '';

            // Handle relative URLs
            if (cover && !cover.startsWith('http') && !cover.startsWith('data:')) {
                cover = `${BASE_URL}${cover.startsWith('/') ? '' : '/'}${cover}`;
            }

            // Clean up cover URL (remove -175x238 etc size suffixes for original size)
            cover = cover.replace(/-\d+x\d+\./, '.');

            const statusText = $el.find('.mg_status, .summary-content, .status, .epxs').text().toLowerCase();
            let status = 'Unknown';
            if (statusText.includes('ongoing')) status = 'Ongoing';
            else if (statusText.includes('completed') || statusText.includes('tamat') || statusText.includes('end')) status = 'Completed';

            const latestChapter = $el.find('.chapter a, .list-chapter a, .epxs').first().text().trim();

            results.push({
                source: 'Mgkomik',
                id: slug,
                title,
                cover,
                status,
                latestChapter,
                link: href,
                slug,
            });
            found = true;
        });
        if (found) break;
    }

    // If no results found, try parsing grid items
    if (results.length === 0) {
        $('article, .manga, .serie-box, .listupd .bs, .animepost').each((_, element) => {
            const $el = $(element);
            const $link = $el.find('a').first();
            const href = $link.attr('href') || '';
            const title = $el.find('h3, h4, .series-title, .title, .tt').first().text().trim() || $link.attr('title') || '';

            if (!href || !title) return;

            const slug = href.split('/').filter(Boolean).pop() || '';
            const $img = $el.find('img').first();
            let cover = $img.attr('data-src') || $img.attr('src') || '';

            if (cover && !cover.startsWith('http') && !cover.startsWith('data:')) {
                cover = `${BASE_URL}${cover.startsWith('/') ? '' : '/'}${cover}`;
            }

            results.push({
                source: 'Mgkomik',
                id: slug,
                title,
                cover,
                status: 'Unknown',
                link: href,
                slug,
            });
        });
    }

    return NextResponse.json({
        success: true,
        source: 'Mgkomik',
        page,
        count: results.length,
        data: results,
    });
}

interface MangaItem {
    source: string;
    id: string;
    title: string;
    cover: string;
    status: string;
    latestChapter?: string;
    link: string;
    slug: string;
}
