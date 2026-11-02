import React, { useState } from 'react';
import { Link2, ArrowRight, Copy, Check, CornerDownRight } from 'lucide-react';
import {
  ShortenedLinkItem,
  validateAndNormalizeUrl,
  copyToClipboard,
} from '../utils/urlShortenerLogic';

interface ShortenFormProps {
  onShorten: (normalizedUrl: string) => Promise<ShortenedLinkItem>;
  latestResult: ShortenedLinkItem | null;
  onTestRedirect: (shortCode: string) => void;
  apiBaseUrl: string;
}

export function ShortenForm({
  onShorten,
  latestResult,
  onTestRedirect,
  apiBaseUrl,
}: ShortenFormProps) {
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateAndNormalizeUrl(urlInput);
    if (!validation.valid || !validation.normalizedUrl) {
      setError(validation.error || 'Please enter a valid URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onShorten(validation.normalizedUrl);
      setUrlInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to shorten URL.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async (text: string, code: string) => {
    await copyToClipboard(text);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 1800);
  };

  return (
    <section id="shorten-section" aria-labelledby="shorten-heading" className="space-y-6">
      <div className="space-y-2">
        <h1
          id="shorten-heading"
          className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900"
          style={{ textWrap: 'balance' }}
        >
          Shorten long links into clean 6-digit codes
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          Connects directly to your FastAPI <code className="font-mono text-xs text-slate-800">POST /shorten</code> and{' '}
          <code className="font-mono text-xs text-slate-800">GET /&#123;short_code&#125;</code> endpoints, pre-configured with Vercel Serverless routing.
          Target server: <span className="font-mono text-xs text-slate-800">{apiBaseUrl}</span>
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="destination-url-input"
              className="block text-sm font-semibold text-slate-900"
            >
              Destination URL
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Link2 className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="destination-url-input"
                  name="url"
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://example.com/very/long/path/to/resource"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'url-input-error' : undefined}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                    error
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/10'
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{isSubmitting ? 'Shortening...' : 'Shorten URL'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {error && (
              <p
                id="url-input-error"
                role="alert"
                className="text-xs font-medium text-red-600 pt-1"
              >
                {error}
              </p>
            )}
          </div>
        </form>

        {latestResult && (
          <div
            aria-live="polite"
            className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Latest shortened URL</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">Code #{latestResult.shortCode}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-semibold text-slate-900 tabular-nums truncate">
                  {latestResult.shortUrl}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                <CornerDownRight className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="truncate" title={latestResult.originalUrl}>
                  {latestResult.originalUrl}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(latestResult.shortUrl, latestResult.shortCode)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedCode === latestResult.shortCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                    <span>Copy Short URL</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onTestRedirect(latestResult.shortCode)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Verify Redirect</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
