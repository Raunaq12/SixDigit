export interface ShortenedLinkItem {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
}

export interface UrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
}

export interface VercelConfigSpec {
  $schema: string;
  version: number;
  buildCommand: string;
  outputDirectory: string;
  framework: string;
  rewrites: Array<{
    source: string;
    destination: string;
  }>;
}

/**
 * Validates a user-entered URL string.
 * Requires a non-empty valid http:// or https:// URL (or auto-prepends https:// if a bare domain like example.com is entered).
 * Never substitutes a fallback URL when input is empty or malformed.
 */
export function validateAndNormalizeUrl(rawInput: string): UrlValidationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please enter a destination URL to shorten.',
    };
  }

  if (/\s/.test(trimmed)) {
    return {
      valid: false,
      error: 'URL cannot contain spaces.',
    };
  }

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Only http:// and https:// URLs are supported.',
      };
    }

    const host = parsed.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    const hasValidDomain = host.includes('.') && !host.startsWith('.') && !host.endsWith('.');

    if (!isLocalhost && !hasValidDomain) {
      return {
        valid: false,
        error: 'Please enter a valid domain name (for example, https://example.com).',
      };
    }

    return {
      valid: true,
      normalizedUrl: parsed.toString(),
    };
  } catch {
    return {
      valid: false,
      error: 'Please enter a valid URL (for example, https://example.com/article).',
    };
  }
}

/**
 * Mirrors FastAPI generate_short_code():
 * characters = string.digits
 * code = ''.join(secrets.choice(characters) for _ in range(6))
 */
export function generateSixDigitCode(randomIndexFn?: (max: number) => number): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = randomIndexFn
      ? randomIndexFn(digits.length)
      : Math.floor(Math.random() * digits.length);
    code += digits[idx];
  }
  return code;
}

/**
 * Extracts and validates a 6-digit numeric short code from either a raw code ("482910")
 * or a full short URL ("http://localhost:8000/482910").
 */
export function extractShortCode(input: string): { valid: boolean; shortCode?: string; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Enter a 6-digit short code or full short URL.',
    };
  }

  if (/^\d{6}$/.test(trimmed)) {
    return { valid: true, shortCode: trimmed };
  }

  try {
    const parsed = new URL(trimmed);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || '';
    if (/^\d{6}$/.test(lastSegment)) {
      return { valid: true, shortCode: lastSegment };
    }
    return {
      valid: false,
      error: 'URL path must end with a 6-digit numeric code (e.g. /482910).',
    };
  } catch {
    const cleanSlash = trimmed.replace(/^\/+/, '');
    if (/^\d{6}$/.test(cleanSlash)) {
      return { valid: true, shortCode: cleanSlash };
    }
    return {
      valid: false,
      error: 'Short code must be exactly 6 digits (0-9) matching FastAPI string.digits.',
    };
  }
}

/**
 * Builds the exact JSON payload expected by FastAPI's `class URLRequest(BaseModel): url: str`
 */
export function buildShortenPayload(url: string): { url: string } {
  return { url };
}

/**
 * Parses the FastAPI `{"short_url": "http://localhost:8000/123456"}` response
 */
export function parseShortenResponse(
  data: unknown,
  originalUrl: string,
  nowIso: string = new Date().toISOString()
): ShortenedLinkItem {
  if (!data || typeof data !== 'object' || !('short_url' in data)) {
    throw new Error('Invalid response from backend: missing "short_url" field.');
  }

  const shortUrl = String((data as { short_url: unknown }).short_url);
  const extracted = extractShortCode(shortUrl);
  const shortCode = extracted.shortCode || shortUrl.split('/').pop() || '000000';

  return {
    shortCode,
    shortUrl,
    originalUrl,
    createdAt: nowIso,
  };
}

/**
 * Filters shortened link items by query string across shortCode, shortUrl, and originalUrl.
 */
export function filterLinks(links: ShortenedLinkItem[], query: string): ShortenedLinkItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return links;
  return links.filter(
    (item) =>
      item.shortCode.toLowerCase().includes(q) ||
      item.shortUrl.toLowerCase().includes(q) ||
      item.originalUrl.toLowerCase().includes(q)
  );
}

/**
 * Formats a concise status message when a short URL is copied to the clipboard.
 */
export function formatCopyConfirmation(shortUrl: string): string {
  return `Copied ${shortUrl} to clipboard`;
}

/**
 * Generates the Vercel configuration (`vercel.json`) for either the full-stack
 * Node/Express serverless runtime (`api/index.ts`) or Python FastAPI serverless runtime (`main.py`).
 */
export function buildVercelConfig(runtime: 'node' | 'python' = 'node'): VercelConfigSpec {
  const destination = runtime === 'python' ? '/main.py' : '/api/index';
  return {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    version: 2,
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    framework: 'vite',
    rewrites: [
      {
        source: '/shorten',
        destination,
      },
      {
        source: '/api/:path*',
        destination,
      },
      {
        source: '/:short_code(\\d{6})',
        destination,
      },
      {
        source: '/((?!api/|shorten|\\d{6}).*)',
        destination: '/index.html',
      },
    ],
  };
}

/**
 * Builds the Vercel Import URL for an existing GitHub repository (avoids creating a duplicate repo).
 */
export function buildVercelDeployUrl(repoUrl: string = 'https://github.com/Raunaq12/SixDigit'): string {
  const cleanRepo = repoUrl.trim().replace(/\/+$/, '');
  const encodedRepo = encodeURIComponent(cleanRepo);
  return `https://vercel.com/new/import?s=${encodedRepo}`;
}

/**
 * Copies text to the user's clipboard using the Clipboard API with a DOM textarea fallback
 * so copying works reliably inside sandboxed iframes and all browsers.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to textarea fallback when iframe permissions block navigator.clipboard
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      const succeeded = document.execCommand('copy');
      document.body.removeChild(textarea);
      return succeeded;
    } catch {
      return false;
    }
  }

  return false;
}
