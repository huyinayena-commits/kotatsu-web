import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Mgkomik - Madara Theme Parser
// Domain: mgkomik.org (updated from id.mgkomik.cc)

const BASE_URL = "https://mgkomik.org";
const LIST_URL = `${BASE_URL}/komik/`;

function getHeaders(): HeadersInit {
    return {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': BASE_URL + '/',
        'Origin': BASE_URL,
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
    };
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

        const response = await fetch(url, {
            headers: getHeaders(),
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            // Try alternative URL structure
            const altUrl = `${BASE_URL}/manga/?page=${page}`;
            const altResponse = await fetch(altUrl, {
                headers: getHeaders(),
                next: { revalidate: 300 },
            });

            if (!altResponse.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }

            const html = await altResponse.text();
            return parseAndRespond(html, page);
        }

        const html = await response.text();
        return parseAndRespond(html, page);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
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
    ];

    let found = false;
    for (const selector of selectors) {
        $(selector).each((_, element) => {
            const $el = $(element);
            const $link = $el.find('a[href*="/komik/"], a[href*="/manga/"], .post-title a, h3 a').first();
            const href = $link.attr('href') || '';
            const title = $link.text().trim() || $el.find('.post-title, h3, h4').first().text().trim();

            if (!href || !title) return;

            const slug = href.split('/').filter(Boolean).pop() || '';
            const $img = $el.find('img').first();
            // Try multiple image attributes
            let cover = $img.attr('data-src')
                || $img.attr('data-lazy-src')
                || $img.attr('data-original')
                || $img.attr('src')
                || '';

            // Handle relative URLs
            if (cover && !cover.startsWith('http') && !cover.startsWith('data:')) {
                cover = `https://mgkomik.org${cover.startsWith('/') ? '' : '/'}${cover}`;
            }

            // Clean up cover URL (remove -175x238 etc size suffixes for original size)
            cover = cover.replace(/-\d+x\d+\./, '.');

            const statusText = $el.find('.mg_status, .summary-content, .status').text().toLowerCase();
            let status = 'Unknown';
            if (statusText.includes('ongoing')) status = 'Ongoing';
            else if (statusText.includes('completed') || statusText.includes('tamat')) status = 'Completed';

            const latestChapter = $el.find('.chapter a, .list-chapter a').first().text().trim();

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
        $('article, .manga, .serie-box').each((_, element) => {
            const $el = $(element);
            const $link = $el.find('a').first();
            const href = $link.attr('href') || '';
            const title = $el.find('h3, h4, .series-title, .title').first().text().trim() || $link.attr('title') || '';

            if (!href || !title) return;

            const slug = href.split('/').filter(Boolean).pop() || '';
            const $img = $el.find('img').first();
            const cover = $img.attr('data-src') || $img.attr('src') || '';

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
