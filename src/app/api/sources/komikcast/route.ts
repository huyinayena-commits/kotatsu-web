import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';
import https from 'https';
import { USER_AGENT, COMMON_HEADERS } from '../../services/headers';

// DATA DARI BLUEPRINT BAGIAN A - 2 (KOMIKCAST)
const DOMAIN = "komikcast.li";
const BASE_URL = `https://${DOMAIN}`;

// Axios instance dengan konfigurasi khusus untuk bypass SSL
const axiosClient = axios.create({
    timeout: 30000,
    headers: {
        ...COMMON_HEADERS,
        "Referer": `${BASE_URL}/`,
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Bypass SSL certificate validation
    }),
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || "1";
    const search = searchParams.get('s') || "";

    try {
        let targetUrl: string;

        if (search) {
            // Search endpoint
            targetUrl = `${BASE_URL}/page/${page}/?s=${encodeURIComponent(search)}`;
        } else {
            // List endpoint - BLUEPRINT BAGIAN A-2
            targetUrl = `${BASE_URL}/daftar-komik/page/${page}/`;
        }

        // Fetching dengan axios
        const response = await axiosClient.get(targetUrl);
        const html = response.data;
        const $ = cheerio.load(html);
        const results: MangaItem[] = [];

        // DATA DARI BLUEPRINT BAGIAN B - 1 (SELECTORS KOMIKCAST)
        // Container: "div.list-update_item"
        $("div.list-update_item").each((i, el) => {

            // Selector Judul: "h3.title"
            const title = $(el).find("h3.title").text().trim();

            // Selector Link: "a.data-tooltip" (href)
            const linkElement = $(el).find("a.data-tooltip");
            const link = linkElement.attr("href") || $(el).find("a").first().attr("href");

            // Selector Cover: "img.ts-post-image" (src atau data-src untuk lazy loading)
            let cover = $(el).find("img.ts-post-image").attr("src");
            if (!cover || cover.includes("data:image")) {
                cover = $(el).find("img.ts-post-image").attr("data-src");
            }

            // Selector Rating: ".numscore"
            const rating = $(el).find(".numscore").text().trim();

            // Selector Type (Manga/Manhwa/Manhua): "span.type"
            const type = $(el).find("span.type").text().trim();

            // Chapter terbaru
            const latestChapter = $(el).find(".chapter").first().text().trim();

            if (title && link) {
                // Extract slug dari link
                const slug = link.split("/komik/")[1]?.replace(/\/$/, "") || "";

                results.push({
                    source: "Komikcast",
                    title,
                    cover: cover || "",
                    link,
                    slug,
                    rating: rating || null,
                    type: type || null,
                    latestChapter: latestChapter || null,
                });
            }
        });

        // Kirim hasil JSON ke Frontend
        return NextResponse.json({
            success: true,
            source: "Komikcast",
            page: parseInt(page),
            count: results.length,
            data: results
        });

    } catch (error: unknown) {
        let message = "Unknown error";
        if (axios.isAxiosError(error)) {
            if (error.code === 'ENOTFOUND') {
                message = `DNS tidak ditemukan untuk ${DOMAIN}. Cek koneksi internet.`;
            } else if (error.code === 'ECONNREFUSED') {
                message = `Koneksi ditolak oleh ${DOMAIN}`;
            } else if (error.code === 'ETIMEDOUT') {
                message = `Timeout saat mengakses ${DOMAIN}`;
            } else if (error.response) {
                message = `HTTP Error ${error.response.status}: ${error.response.statusText}`;
            } else {
                message = error.message;
            }
        } else if (error instanceof Error) {
            message = error.message;
        }

        return NextResponse.json(
            { success: false, error: message, domain: DOMAIN },
            { status: 500 }
        );
    }
}

// Type definition
interface MangaItem {
    source: string;
    title: string;
    cover: string;
    link: string;
    slug: string;
    rating: string | null;
    type: string | null;
    latestChapter: string | null;
}
