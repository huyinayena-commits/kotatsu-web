// app/api/services/headers.ts
// Headers dan User Agent dari BLUEPRINT BAGIAN C

// User Agent dari BLUEPRINT BAGIAN C - 1
export const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

export const COMMON_HEADERS = {
  "User-Agent": USER_AGENT,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
};

// Fungsi helper untuk headers spesifik per domain
export function getHeaders(domain: string, referer?: string): Record<string, string> {
  return {
    ...COMMON_HEADERS,
    "Referer": referer || `https://${domain}/`,
  };
}

// Headers khusus untuk Shinigami API
export function getShinigamiHeaders(): Record<string, string> {
  return {
    ...COMMON_HEADERS,
    "Referer": "https://id.shinigami.asia/",
    "sec-fetch-dest": "empty",
  };
}
