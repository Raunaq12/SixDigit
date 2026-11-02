import express from 'express';

export interface ShortenedLinkItem {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
}

export function generateSixDigitCode(): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

const FASTAPI_BASE_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Mirrors `url_store: dict[str, str] = {}` from main.py, pre-seeded with deterministic demo entries
export const urlStore = new Map<string, ShortenedLinkItem>([
  [
    '482910',
    {
      shortCode: '482910',
      shortUrl: 'http://localhost:8000/482910',
      originalUrl: 'https://fastapi.tiangolo.com/tutorial/first-steps/',
      createdAt: '2026-11-02T08:15:00.000Z',
    },
  ],
  [
    '739104',
    {
      shortCode: '739104',
      shortUrl: 'http://localhost:8000/739104',
      originalUrl: 'https://docs.pydantic.dev/latest/concepts/models/',
      createdAt: '2026-11-02T08:42:00.000Z',
    },
  ],
  [
    '195832',
    {
      shortCode: '195832',
      shortUrl: 'http://localhost:8000/195832',
      originalUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections',
      createdAt: '2026-11-02T09:10:00.000Z',
    },
  ],
]);

export function createApiApp() {
  const app = express();
  app.use(express.json());

  /**
   * POST /shorten
   * Exact contract from user's FastAPI main.py:
   * Request body: { "url": string }
   * Response body: { "short_url": "http://localhost:8000/{6-digit-code}" }
   */
  app.post('/shorten', async (req, res) => {
    const rawUrl = req.body?.url;
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      res.status(422).json({ detail: 'Field "url" is required.' });
      return;
    }

    const cleanUrl = rawUrl.trim();
    const headerBase =
      typeof req.headers['x-fastapi-base-url'] === 'string'
        ? req.headers['x-fastapi-base-url'].trim()
        : '';
    const targetFastApiBase = headerBase || FASTAPI_BASE_URL;

    // First attempt to forward to a running FastAPI instance if configured & reachable
    if (!process.env.VERCEL || (headerBase && !headerBase.includes('localhost'))) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 600);
        const fastApiRes = await fetch(`${targetFastApiBase.replace(/\/+$/, '')}/shorten`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: cleanUrl }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (fastApiRes.ok) {
          const data = (await fastApiRes.json()) as { short_url: string };
          const shortCode = data.short_url.split('/').pop() || generateSixDigitCode();
          urlStore.set(shortCode, {
            shortCode,
            shortUrl: data.short_url,
            originalUrl: cleanUrl,
            createdAt: new Date().toISOString(),
          });
          res.json(data);
          return;
        }
      } catch {
        // FastAPI not running on port 8000 in this container; execute identical FastAPI main.py logic
      }
    }

    let shortCode = generateSixDigitCode();
    while (urlStore.has(shortCode)) {
      shortCode = generateSixDigitCode();
    }

    const effectiveBase = (headerBase || 'http://localhost:8000').replace(/\/+$/, '');
    const shortUrl = `${effectiveBase}/${shortCode}`;
    urlStore.set(shortCode, {
      shortCode,
      shortUrl,
      originalUrl: cleanUrl,
      createdAt: new Date().toISOString(),
    });

    res.json({ short_url: shortUrl });
  });

  /**
   * GET /api/links
   * Returns current session links in reverse chronological order
   */
  app.get('/api/links', (_req, res) => {
    const items = Array.from(urlStore.values()).reverse();
    res.json({ links: items });
  });

  /**
   * DELETE /api/links/:short_code
   * Deletes a single link from the store
   */
  app.delete('/api/links/:short_code', (req, res) => {
    const { short_code } = req.params;
    const existed = urlStore.delete(short_code);
    if (!existed) {
      res.status(404).json({ detail: 'URL not found.' });
      return;
    }
    res.json({ deleted: short_code });
  });

  /**
   * DELETE /api/links
   * Clears all links from the store
   */
  app.delete('/api/links', (_req, res) => {
    urlStore.clear();
    res.json({ cleared: true });
  });

  /**
   * GET /api/resolve/:short_code
   * Inspects the redirect target for `GET /{short_code}` without navigating away from the iframe
   */
  app.get('/api/resolve/:short_code', async (req, res) => {
    const { short_code } = req.params;

    if (!process.env.VERCEL) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 500);
        const fastApiRes = await fetch(`${FASTAPI_BASE_URL}/${encodeURIComponent(short_code)}`, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (fastApiRes.status >= 300 && fastApiRes.status < 400) {
          const location = fastApiRes.headers.get('location');
          if (location) {
            res.json({
              short_code,
              target_url: location,
              status_code: fastApiRes.status,
            });
            return;
          }
        } else if (fastApiRes.status === 404) {
          res.status(404).json({ detail: 'URL not found.' });
          return;
        }
      } catch {
        // Fallback to in-memory urlStore matching main.py
      }
    }

    const entry = urlStore.get(short_code);
    if (entry) {
      res.json({
        short_code,
        target_url: entry.originalUrl,
        status_code: 307,
      });
    } else {
      res.status(404).json({ detail: 'URL not found.' });
    }
  });

  /**
   * GET /:short_code (when 6 digits)
   * Exact contract from user's FastAPI main.py:
   * @app.get('/{short_code}')
   * Returns RedirectResponse(url=url_store[short_code]) or 404 {"detail": "URL not found."}
   */
  app.get('/:short_code(\\d{6})', (req, res) => {
    const { short_code } = req.params;
    const entry = urlStore.get(short_code);
    if (entry) {
      res.redirect(307, entry.originalUrl);
    } else {
      res.status(404).json({ detail: 'URL not found.' });
    }
  });

  return app;
}

const apiApp = createApiApp();
export default apiApp;
