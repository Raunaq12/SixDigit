import { useState } from 'react';
import { Copy, Check, Trash2, Search, ExternalLink } from 'lucide-react';
import {
  ShortenedLinkItem,
  filterLinks,
  copyToClipboard,
  formatCopyConfirmation,
} from '../utils/urlShortenerLogic';

interface LinksTableProps {
  links: ShortenedLinkItem[];
  onDelete: (shortCode: string) => void;
  onClearAll: () => void;
  onTestRedirect: (shortCode: string) => void;
  onFocusShortenInput: () => void;
}

export function LinksTable({
  links,
  onDelete,
  onClearAll,
  onTestRedirect,
  onFocusShortenInput,
}: LinksTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  const filtered = filterLinks(links, searchQuery);

  const handleCopy = async (shortUrl: string, shortCode: string) => {
    await copyToClipboard(shortUrl);
    setCopiedCode(shortCode);
    setCopiedMessage(formatCopyConfirmation(shortUrl));
    setTimeout(() => {
      setCopiedCode((prev) => (prev === shortCode ? null : prev));
      setCopiedMessage((prev) =>
        prev === formatCopyConfirmation(shortUrl) ? null : prev
      );
    }, 2000);
  };

  return (
    <section id="directory-section" aria-labelledby="directory-heading" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 id="directory-heading" className="text-lg font-bold text-slate-900">
            Active Shortened URLs
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              In-memory <code className="font-mono">url_store</code> mappings ({links.length}{' '}
              {links.length === 1 ? 'entry' : 'entries'})
            </span>
            {copiedMessage && (
              <>
                <span aria-hidden="true">·</span>
                <span role="status" aria-live="polite" className="text-emerald-700 font-medium">
                  {copiedMessage}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <label htmlFor="filter-links-input" className="sr-only">
              Filter shortened links
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="filter-links-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by 6-digit code or URL..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
            />
          </div>
          {links.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 bg-white border border-slate-300 hover:border-red-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Clear Store
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {links.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-900">No URLs in url_store yet</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Submit a destination link above to generate a 6-digit code via{' '}
              <code className="font-mono">POST /shorten</code>.
            </p>
            <button
              type="button"
              onClick={onFocusShortenInput}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Shorten First URL
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-medium text-slate-900">
              No matching links for &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900 cursor-pointer"
            >
              Reset filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Short Code</th>
                  <th className="py-3 px-4 whitespace-nowrap">FastAPI Short URL</th>
                  <th className="py-3 px-4">Destination URL</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((item) => {
                  const isCopied = copiedCode === item.shortCode;
                  return (
                    <tr
                      key={item.shortCode}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        /{item.shortCode}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2.5">
                          <span className="font-mono text-xs text-slate-800 tabular-nums">
                            {item.shortUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.shortUrl, item.shortCode)}
                            title={`Copy ${item.shortUrl}`}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-700" aria-hidden="true" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500" aria-hidden="true" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <a
                          href={item.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={item.originalUrl}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 max-w-full"
                        >
                          <span className="truncate">{item.originalUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" aria-hidden="true" />
                        </a>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onTestRedirect(item.shortCode)}
                            aria-label={`Verify redirect for ${item.shortCode}`}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Resolve
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(item.shortCode)}
                            aria-label={`Delete short code ${item.shortCode}`}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
