import { NextResponse } from 'next/server';
import { getShinigamiHeaders } from '../../../../services/headers';

// API untuk mengambil halaman chapter dari Shinigami
// Berdasarkan parser Kotlin: https://api.shngm.io/v1/chapter/detail/{chapterId}
const API_URL = "https://api.shngm.io/v1";
const CDN_URL = "https://storage.shngm.id";

interface Params {
    params: Promise<{ chapterId: string }>;
}

export async function GET(request: Request, { params }: Params) {
    const { chapterId } = await params;

    try {
        // Fetch chapter pages dari API Shinigami
        const chapterUrl = `${API_URL}/chapter/detail/${chapterId}`;

        const response = await fetch(chapterUrl, {
            headers: getShinigamiHeaders(),
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Gagal mengambil halaman chapter: ${response.status}`);
        }

        const json = await response.json();
        const data = json.data;

        // Struktur response berdasarkan parser Kotlin:
        // data.chapter.path = "/path/to/images/"
        // data.chapter.data = ["1.jpg", "2.jpg", ...]
        const chapterData = data.chapter;
        const basePath = chapterData.path;
        const imageFiles: string[] = chapterData.data || [];

        // Build image URLs: https://storage.shngm.id + path + filename
        const pages = imageFiles.map((filename: string, index: number) => ({
            index: index + 1,
            url: `${CDN_URL}${basePath}${filename}`,
        }));

        // Juga fetch manga detail untuk mendapatkan title dan cover
        let mangaTitle = data.manga_title || '';
        let mangaCover = '';

        // Jika manga_title kosong, coba fetch dari manga detail
        if (!mangaTitle && data.manga_id) {
            try {
                const mangaResponse = await fetch(`${API_URL}/manga/detail/${data.manga_id}`, {
                    headers: getShinigamiHeaders(),
                    cache: 'no-store',
                });
                if (mangaResponse.ok) {
                    const mangaJson = await mangaResponse.json();
                    const mangaData = mangaJson.data;
                    mangaTitle = mangaData.title || 'Unknown';
                    mangaCover = mangaData.cover_image_url || mangaData.cover_portrait_url || '';
                }
            } catch {
                // Ignore error, keep empty
            }
        }

        // Info chapter - pastikan chapter_number ada
        const chapterNumber = chapterData.chapter_number ?? data.chapter_number ?? 0;

        const chapterInfo = {
            id: chapterId,
            mangaId: data.manga_id || '',
            mangaTitle: mangaTitle || 'Unknown',
            mangaCover: mangaCover,
            chapterNumber: chapterNumber,
            chapterTitle: chapterData.chapter_title || `Chapter ${chapterNumber}`,
            totalPages: pages.length,
            prevChapterId: data.prev_chapter_id || null,
            nextChapterId: data.next_chapter_id || null,
        };

        return NextResponse.json({
            success: true,
            source: "Shinigami",
            chapter: chapterInfo,
            pages,
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
