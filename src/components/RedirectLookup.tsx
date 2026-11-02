import React, { useState, useEffect } from 'react';
import { ArrowUpRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { extractShortCode } from '../utils/urlShortenerLogic';

export interface LookupResult {
  shortCode: string;
  found: boolean;
  statusCode: number;
  targetUrl?: string;
  detail?: string;
}

interface RedirectLookupProps {
  externalLookupRequest: { code: string; nonce: number } | null;
  onResolveCode: (shortCode: string) => Promise<LookupResult>;
}

export function RedirectLookup({
  externalLookupRequest,
  onResolveCode,
}: RedirectLookupProps) {
  const [codeInput, setCodeInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  useEffect(() => {
    if (externalLookupRequest?.code) {
      const code = externalLookupRequest.code;
      setCodeInput(code);
      setValidationError(null);
      setIsLoading(true);
      onResolveCode(code)
        .then((res) => setResult(res))
        .finally(() => setIsLoading(false));
    }
  }, [externalLookupRequest, onResolveCode]);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const parsed = extractShortCode(codeInput);
    if (!parsed.valid || !parsed.shortCode) {
      setValidationError(parsed.error || 'Enter a valid 6-digit code.');
      setResult(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await onResolveCode(parsed.shortCode);
      setResult(res);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      id="lookup-section"
      aria-labelledby="lookup-heading"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
    >
      <div className="space-y-1">
        <h2 id="lookup-heading" className="text-base font-bold text-slate-900">
          Test <code className="font-mono text-sm">GET /&#123;short_code&#125;</code> Redirect Resolution
        </h2>
        <p className="text-xs text-slate-500">
          Enter any 6-digit code or full short URL to verify whether <code className="font-mono">url_store</code> returns a{' '}
          <code className="font-mono">RedirectResponse</code> or raises <code className="font-mono">HTTPException(404, detail=&quot;URL not found.&quot;)</code>.
        </p>
      </div>

      <form onSubmit={handleLookupSubmit} noValidate className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="lookup-code-input" className="sr-only">
            6-digit short code or short URL
          </label>
          <input
            id="lookup-code-input"
            type="text"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="Enter 6-digit code (e.g. 482910 or 999999)"
            className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:border-slate-900 tabular-nums"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isLoading ? 'Checking...' : 'Check Redirect'}
        </button>
      </form>

      {validationError && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {validationError}
        </p>
      )}

      {result && (
        <div
          aria-live="polite"
          className={`p-4 rounded-lg border text-xs space-y-2 ${
            result.found
              ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
              : 'bg-red-50/60 border-red-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold">
              {result.found ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>
                    GET /{result.shortCode} · {result.statusCode} RedirectResponse
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
                  <span>
                    GET /{result.shortCode} · {result.statusCode} Not Found
                  </span>
                </>
              )}
            </div>
          </div>

          {result.found && result.targetUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div className="font-mono text-xs text-slate-700 truncate">
                Location: <span className="font-semibold text-slate-900">{result.targetUrl}</span>
              </div>
              <a
                href={result.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-emerald-800 hover:underline whitespace-nowrap shrink-0"
              >
                <span>Open Destination</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          ) : (
            <pre className="font-mono text-xs text-red-800 overflow-x-auto">
              {JSON.stringify({ detail: result.detail || 'URL not found.' })}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
