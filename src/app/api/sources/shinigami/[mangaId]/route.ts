import { NextResponse } from 'next/server';
import { getShinigamiHeaders } from '../../../services/headers';

// DATA DARI BLUEPRINT BAGIAN A - 1 (SHINIGAMI - API BASED)
const API_URL = "https://api.shngm.io/v1";

interface Params {
    params: Promise<{ mangaId: string }>;
}

export async function GET(request: Request, { params }: Params) {
    const { mangaId } = await params;

    try {
        // 1. Fetch manga detail
        const detailUrl = `${API_URL}/manga/detail/${mangaId}`;
        const detailResponse = await fetch(detailUrl, {
            headers: getShinigamiHeaders(),
            next: { revalidate: 300 }, // Cache 5 menit
        });

        if (!detailResponse.ok) {
            throw new Error(`Gagal mengambil detail manga: ${detailResponse.status}`);
        }

        const detailJson = await detailResponse.json();
        const mangaData = detailJson.data;

        // 2. Fetch chapter list
        const chapterUrl = `${API_URL}/chapter/${mangaId}/list?page=1&page_size=9999&sort_by=chapter_number&sort_order=asc`;
        const chapterResponse = await fetch(chapterUrl, {
            headers: getShinigamiHeaders(),
            next: { revalidate: 300 },
        });

        let chapters: Chapter[] = [];
        if (chapterResponse.ok) {
            const chapterJson = await chapterResponse.json();
            chapters = (chapterJson.data || []).map((ch: ShinigamiChapter) => ({
                id: ch.chapter_id,
                number: ch.chapter_number,
                title: ch.chapter_title || `Chapter ${ch.chapter_number}`,
                releaseDate: ch.release_date,
            }));
        }

        // Transform manga data
        const manga: MangaDetail = {
            id: mangaData.manga_id,
            title: mangaData.title,
            altTitle: mangaData.alternative_title || null,
            cover: mangaData.cover_image_url || "",
            largeCover: mangaData.cover_portrait_url || null,
            description: mangaData.description || "Tidak ada sinopsis.",
            status: getStatusText(mangaData.status),
            genres: mangaData.taxonomy?.Genre?.map((g: { name: string }) => g.name) || [],
            authors: mangaData.taxonomy?.Author?.map((a: { name: string }) => a.name) || [],
            artists: mangaData.taxonomy?.Artist?.map((a: { name: string }) => a.name) || [],
            rating: mangaData.rating || null,
            views: mangaData.views || null,
            chapters,
            totalChapters: chapters.length,
        };

        return NextResponse.json({
            success: true,
            source: "Shinigami",
            data: manga,
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

function getStatusText(status: number): string {
    switch (status) {
        case 1: return "Ongoing";
        case 2: return "Completed";
        case 3: return "Hiatus";
        default: return "Unknown";
    }
}

// Type definitions
interface ShinigamiChapter {
    chapter_id: string;
    chapter_number: number;
    chapter_title?: string;
    release_date: string;
}

interface Chapter {
    id: string;
    number: number;
    title: string;
    releaseDate: string;
}

interface MangaDetail {
    id: string;
    title: string;
    altTitle: string | null;
    cover: string;
    largeCover: string | null;
    description: string;
    status: string;
    genres: string[];
    authors: string[];
    artists: string[];
    rating: number | null;
    views: number | null;
    chapters: Chapter[];
    totalChapters: number;
}
