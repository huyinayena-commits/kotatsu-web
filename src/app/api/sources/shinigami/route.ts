import { NextResponse } from 'next/server';
import { getShinigamiHeaders } from '../../services/headers';

// DATA DARI BLUEPRINT BAGIAN A - 1 (SHINIGAMI - API BASED)
const API_URL = "https://api.shngm.io/v1";
const CDN_URL = "https://storage.shngm.id";
const PAGE_SIZE = 24;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || "1";
    const search = searchParams.get('q') || "";
    const sort = searchParams.get('sort') || "latest"; // popularity, latest, rating
    const sortOrder = searchParams.get('order') || "desc"; // asc, desc

    try {
        // Build API URL - BLUEPRINT BAGIAN A-1
        const apiUrl = new URL(`${API_URL}/manga/list`);
        apiUrl.searchParams.set('page', page);
        apiUrl.searchParams.set('page_size', PAGE_SIZE.toString());
        apiUrl.searchParams.set('sort', sort);
        apiUrl.searchParams.set('sort_order', sortOrder);

        if (search) {
            apiUrl.searchParams.set('q', search);
        }

        // Fetching dengan headers Shinigami
        const response = await fetch(apiUrl.toString(), {
            headers: getShinigamiHeaders(),
            next: { revalidate: 60 },
        });

        if (!response.ok) {
            throw new Error(`Gagal akses Shinigami API: ${response.status}`);
        }

        const json = await response.json();
        const data = json.data || [];

        // Transform data sesuai BLUEPRINT BAGIAN D
        const results: MangaItem[] = data.map((item: ShinigamiManga) => {
            // Status: 1=Ongoing, 2=Finished, 3=Paused
            let status = "Unknown";
            switch (item.status) {
                case 1: status = "Ongoing"; break;
                case 2: status = "Completed"; break;
                case 3: status = "Hiatus"; break;
            }

            // Extract genres
            const genres = item.taxonomy?.Genre?.map((g: { name: string }) => g.name) || [];

            // Extract authors
            const authors = item.taxonomy?.Author?.map((a: { name: string }) => a.name) || [];

            // Build proper cover URL
            let coverUrl = item.cover_image_url || '';
            if (coverUrl && !coverUrl.startsWith('http')) {
                coverUrl = `${CDN_URL}/${coverUrl.replace(/^\/+/, '')}`;
            }

            let largeCoverUrl = item.cover_portrait_url || null;
            if (largeCoverUrl && !largeCoverUrl.startsWith('http')) {
                largeCoverUrl = `${CDN_URL}/${largeCoverUrl.replace(/^\/+/, '')}`;
            }

            return {
                source: "Shinigami",
                id: item.manga_id,
                title: item.title,
                altTitle: item.alternative_title || null,
                cover: coverUrl,
                largeCover: largeCoverUrl,
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
            page: parseInt(page),
            pageSize: PAGE_SIZE,
            count: results.length,
            data: results
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

// Type definitions berdasarkan BLUEPRINT BAGIAN D
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
