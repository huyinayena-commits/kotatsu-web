import { NextResponse } from 'next/server';
import { getShinigamiHeaders } from '../services/headers';

// API untuk pencarian manga dari Shinigami
// Format: /manga/list?q={query}
const API_URL = "https://api.shngm.io/v1";
const PAGE_SIZE = 24;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || "";
    const page = searchParams.get('page') || "1";
    const sort = searchParams.get('sort') || "popularity"; // popularity, latest, rating
    const sortOrder = searchParams.get('order') || "desc"; // asc, desc

    // Validasi query
    if (!query.trim()) {
        return NextResponse.json({
            success: false,
            error: "Query pencarian tidak boleh kosong",
        }, { status: 400 });
    }

    try {
        // Build search URL sesuai format Shinigami
        // Format: /manga/list?q={query}&page=1&page_size=24&sort=popularity&sort_order=desc
        const apiUrl = new URL(`${API_URL}/manga/list`);
        apiUrl.searchParams.set('page', page);
        apiUrl.searchParams.set('page_size', PAGE_SIZE.toString());
        apiUrl.searchParams.set('sort', sort);
        apiUrl.searchParams.set('sort_order', sortOrder);

        // Encode query: "one piece" -> "one+piece"
        const encodedQuery = query.trim().split(/\s+/).join('+');
        apiUrl.searchParams.set('q', encodedQuery);

        const response = await fetch(apiUrl.toString(), {
            headers: getShinigamiHeaders(),
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Gagal mencari manga: ${response.status}`);
        }

        const json = await response.json();
        const data = json.data || [];

        // Transform data
        const results: MangaItem[] = data.map((item: ShinigamiManga) => {
            let status = "Unknown";
            switch (item.status) {
                case 1: status = "Ongoing"; break;
                case 2: status = "Completed"; break;
                case 3: status = "Hiatus"; break;
            }

            const genres = item.taxonomy?.Genre?.map((g: { name: string }) => g.name) || [];
            const authors = item.taxonomy?.Author?.map((a: { name: string }) => a.name) || [];

            return {
                source: "Shinigami",
                id: item.manga_id,
                title: item.title,
                altTitle: item.alternative_title || null,
                cover: item.cover_image_url || "",
                largeCover: item.cover_portrait_url || null,
                description: item.description || null,
                status,
                genres,
                authors,
                link: `https://id.shinigami.asia/series/${item.manga_id}`,
                slug: item.manga_id,
            };
        });

        return NextResponse.json({
            success: true,
            source: "Shinigami",
            query: query,
            page: parseInt(page),
            pageSize: PAGE_SIZE,
            count: results.length,
            data: results,
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

// Type definitions
interface ShinigamiManga {
    manga_id: string;
    title: string;
    alternative_title?: string;
    cover_image_url?: string;
    cover_portrait_url?: string;
    description?: string;
    status: number;
    taxonomy?: {
        Genre?: Array<{ name: string; slug: string }>;
        Author?: Array<{ name: string }>;
    };
}

interface MangaItem {
    source: string;
    id: string;
    title: string;
    altTitle: string | null;
    cover: string;
    largeCover: string | null;
    description: string | null;
    status: string;
    genres: string[];
    authors: string[];
    link: string;
    slug: string;
}
