import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';
import https from 'https';
import { USER_AGENT, COMMON_HEADERS } from '../../services/headers';

// DATA DARI BLUEPRINT BAGIAN A - 3 (KOMIKU)
const DOMAIN = "komiku.org";
const API_DOMAIN = "api.komiku.id";
const BASE_URL = `https://${API_DOMAIN}`;

// Axios instance dengan konfigurasi khusus
const axiosClient = axios.create({
    timeout: 30000,
    headers: {
        ...COMMON_HEADERS,
        "Referer": `https://${DOMAIN}/`,
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: false,
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
            targetUrl = `${BASE_URL}/page/${page}/?post_type=manga&s=${encodeURIComponent(search)}`;
        } else {
            // List endpoint - BLUEPRINT BAGIAN A-3
            if (page === "1") {
                targetUrl = `${BASE_URL}/manga/`;
            } else {
                targetUrl = `${BASE_URL}/manga/page/${page}/`;
            }
        }

        // Fetching dengan axios
        const response = await axiosClient.get(targetUrl);
        const html = response.data;
        const $ = cheerio.load(html);
        const results: MangaItem[] = [];

        // DATA DARI BLUEPRINT BAGIAN B - 1 (SELECTORS KOMIKU)
        // Container: "div.bge"
        $("div.bge").each((i, el) => {

            // Selector Link & Title
            const linkElement = $(el).find("a:has(h3)");
            const link = linkElement.attr("href") || "";

            // Selector Judul: "h3"
            const title = $(el).find("h3").text().trim();

            // Selector Cover: "img"
            let cover = $(el).find("img").attr("src") || "";
            // Fix cover URL jika perlu
            if (cover && !cover.includes("/uploads/")) {
                cover = cover.replace("/Manga-", "/Komik-")
                    .replace("/Manhua-", "/Komik-")
                    .replace("/Manhwa-", "/Komik-");
            }

            // Info tambahan
            const info = $(el).find(".tpe1_inf b").text().trim();

            if (title && link) {
                // Extract slug dari link
                const slug = link.split("/manga/")[1]?.replace(/\/$/, "") ||
                    link.split("/").filter(Boolean).pop() || "";

                results.push({
                    source: "Komiku",
                    title,
                    cover,
                    link: link.startsWith("http") ? link : `https://${DOMAIN}${link}`,
                    slug,
                    info: info || null,
                });
            }
        });

        return NextResponse.json({
            success: true,
            source: "Komiku",
            page: parseInt(page),
            count: results.length,
            data: results
        });

    } catch (error: unknown) {
        let message = "Unknown error";
        if (axios.isAxiosError(error)) {
            if (error.code === 'ENOTFOUND') {
                message = `DNS tidak ditemukan untuk ${API_DOMAIN}. Cek koneksi internet.`;
            } else if (error.code === 'ECONNREFUSED') {
                message = `Koneksi ditolak oleh ${API_DOMAIN}`;
            } else if (error.code === 'ETIMEDOUT') {
                message = `Timeout saat mengakses ${API_DOMAIN}`;
            } else if (error.response) {
                message = `HTTP Error ${error.response.status}: ${error.response.statusText}`;
            } else {
                message = error.message;
            }
        } else if (error instanceof Error) {
            message = error.message;
        }

        return NextResponse.json(
            { success: false, error: message, domain: API_DOMAIN },
            { status: 500 }
        );
    }
}

interface MangaItem {
    source: string;
    title: string;
    cover: string;
    link: string;
    slug: string;
    info: string | null;
}
