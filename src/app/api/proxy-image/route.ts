import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    // Don't proxy empty or data URLs
    if (!imageUrl || imageUrl.startsWith('data:')) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
        // Determine referer based on domain
        const urlObj = new URL(imageUrl);
        const domain = urlObj.hostname;

        // Custom headers for specific domains
        let referer = urlObj.origin;
        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site',
        };

        // Handle specific sources
        if (domain.includes('shngm') || domain.includes('shinigami')) {
            referer = 'https://id.shinigami.asia/';
        } else if (domain.includes('mgkomik')) {
            referer = 'https://id.mgkomik.cc/';
        } else if (domain.includes('komikcast')) {
            referer = 'https://komikcast.io/';
        } else if (domain.includes('komiku')) {
            referer = 'https://komiku.id/';
        }

        headers['Referer'] = referer;
        headers['Origin'] = new URL(referer).origin;

        const response = await fetch(imageUrl, { headers });

        if (!response.ok) {
            // Try without referer as fallback
            const fallbackResponse = await fetch(imageUrl, {
                headers: {
                    'User-Agent': headers['User-Agent'],
                    'Accept': headers['Accept'],
                },
            });

            if (!fallbackResponse.ok) {
                return NextResponse.json(
                    { error: 'Failed to fetch image' },
                    { status: response.status }
                );
            }

            const contentType = fallbackResponse.headers.get('content-type') || 'image/jpeg';
            const buffer = await fallbackResponse.arrayBuffer();

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400',
                },
            });
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400', // Cache for 1 day
            },
        });
    } catch (error) {
        console.error('Image proxy error:', error);
        return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
    }
}
