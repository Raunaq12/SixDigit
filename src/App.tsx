import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ShortenForm } from './components/ShortenForm';
import { LinksTable } from './components/LinksTable';
import { RedirectLookup, LookupResult } from './components/RedirectLookup';
import { VercelDeploySection } from './components/VercelDeploySection';
import { BackendSetupModal } from './components/BackendSetupModal';
import {
  ShortenedLinkItem,
  buildShortenPayload,
  parseShortenResponse,
} from './utils/urlShortenerLogic';

export default function App() {
  const [links, setLinks] = useState<ShortenedLinkItem[]>([]);
  const [latestResult, setLatestResult] = useState<ShortenedLinkItem | null>(null);
  const [externalLookupRequest, setExternalLookupRequest] = useState<{
    code: string;
    nonce: number;
  } | null>(null);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('http://localhost:8000');

  useEffect(() => {
    fetch('/api/links')
      .then((res) => (res.ok ? res.json() : { links: [] }))
      .then((data: { links?: ShortenedLinkItem[] }) => {
        if (Array.isArray(data.links)) {
          setLinks(data.links);
        }
      })
      .catch(() => {
        // Ignore initial fetch errors
      });
  }, []);

  const handleShorten = useCallback(
    async (normalizedUrl: string): Promise<ShortenedLinkItem> => {
      const payload = buildShortenPayload(normalizedUrl);
      const res = await fetch('/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FastAPI-Base-URL': apiBaseUrl,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Shorten request failed with status ${res.status}`);
      }

      const responseData = (await res.json()) as { short_url: string };
      const newItem = parseShortenResponse(responseData, normalizedUrl);

      setLatestResult(newItem);
      setLinks((prev) => [newItem, ...prev.filter((item) => item.shortCode !== newItem.shortCode)]);
      return newItem;
    },
    [apiBaseUrl]
  );

  const handleDeleteLink = useCallback(async (shortCode: string) => {
    setLinks((prev) => prev.filter((item) => item.shortCode !== shortCode));
    setLatestResult((prev) => (prev?.shortCode === shortCode ? null : prev));
    try {
      await fetch(`/api/links/${encodeURIComponent(shortCode)}`, {
        method: 'DELETE',
      });
    } catch {
      // Ignore network error on delete
    }
  }, []);

  const handleClearAll = useCallback(async () => {
    setLinks([]);
    setLatestResult(null);
    try {
      await fetch('/api/links', { method: 'DELETE' });
    } catch {
      // Ignore network error
    }
  }, []);

  const handleResolveCode = useCallback(
    async (shortCode: string): Promise<LookupResult> => {
      try {
        const res = await fetch(`/api/resolve/${encodeURIComponent(shortCode)}`);
        if (res.ok) {
          const data = (await res.json()) as {
            short_code: string;
            target_url: string;
            status_code: number;
          };
          return {
            shortCode,
            found: true,
            statusCode: data.status_code || 307,
            targetUrl: data.target_url,
          };
        }
        // Check local state if serverless instance cold-started
        const localMatch = links.find((item) => item.shortCode === shortCode);
        if (localMatch) {
          return {
            shortCode,
            found: true,
            statusCode: 307,
            targetUrl: localMatch.originalUrl,
          };
        }
        const errData = (await res.json().catch(() => ({ detail: 'URL not found.' }))) as {
          detail?: string;
        };
        return {
          shortCode,
          found: false,
          statusCode: res.status || 404,
          detail: errData.detail || 'URL not found.',
        };
      } catch {
        const localMatch = links.find((item) => item.shortCode === shortCode);
        if (localMatch) {
          return {
            shortCode,
            found: true,
            statusCode: 307,
            targetUrl: localMatch.originalUrl,
          };
        }
        return {
          shortCode,
          found: false,
          statusCode: 404,
          detail: 'URL not found.',
        };
      }
    },
    [links]
  );

  const handleTestRedirect = useCallback((shortCode: string) => {
    setExternalLookupRequest({ code: shortCode, nonce: Date.now() });
    const el = document.getElementById('lookup-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const handleFocusShortenInput = useCallback(() => {
    const input = document.getElementById('destination-url-input');
    if (input) {
      input.focus();
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900">
      <Header onOpenBackendModal={() => setIsBackendModalOpen(true)} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 sm:py-12 space-y-10">
        <ShortenForm
          onShorten={handleShorten}
          latestResult={latestResult}
          onTestRedirect={handleTestRedirect}
          apiBaseUrl={apiBaseUrl}
        />

        <LinksTable
          links={links}
          onDelete={handleDeleteLink}
          onClearAll={handleClearAll}
          onTestRedirect={handleTestRedirect}
          onFocusShortenInput={handleFocusShortenInput}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <RedirectLookup
              externalLookupRequest={externalLookupRequest}
              onResolveCode={handleResolveCode}
            />
          </div>

          <section
            id="spec-section"
            aria-labelledby="spec-heading"
            className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="spec-heading" className="text-base font-bold text-slate-900">
                FastAPI Endpoint Contract
              </h2>
              <button
                type="button"
                onClick={() => setIsBackendModalOpen(true)}
                className="text-xs font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
              >
                View main.py
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-mono font-semibold text-slate-900">POST /shorten</div>
                <div className="text-slate-600">
                  Accepts <code className="font-mono text-slate-800">&#123;&quot;url&quot;: &quot;https://...&quot;&#125;</code> via{' '}
                  <code className="font-mono text-slate-800">URLRequest</code> and stores a 6-digit{' '}
                  <code className="font-mono text-slate-800">string.digits</code> code.
                </div>
                <div className="font-mono text-slate-700 pt-0.5">
                  &rarr; &#123;&quot;short_url&quot;: &quot;http://localhost:8000/482910&quot;&#125;
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-mono font-semibold text-slate-900">GET /&#123;short_code&#125;</div>
                <div className="text-slate-600">
                  Looks up <code className="font-mono text-slate-800">short_code</code> in{' '}
                  <code className="font-mono text-slate-800">url_store</code> and returns{' '}
                  <code className="font-mono text-slate-800">RedirectResponse</code> or{' '}
                  <code className="font-mono text-slate-800">404</code>.
                </div>
                <div className="font-mono text-slate-700 pt-0.5">
                  &rarr; 307 Redirect · 404 &#123;&quot;detail&quot;: &quot;URL not found.&quot;&#125;
                </div>
              </div>
            </div>
          </section>
        </div>

        <VercelDeploySection />
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 px-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>SixDigit URL Shortener Client</span>
          <div className="flex items-center gap-2">
            <span>FastAPI &amp; Vercel Serverless</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">6-Digit Numeric Codes</span>
          </div>
        </div>
      </footer>

      <BackendSetupModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        apiBaseUrl={apiBaseUrl}
        onChangeApiBaseUrl={setApiBaseUrl}
      />
    </div>
  );
}
