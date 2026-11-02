import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import {
  buildVercelConfig,
  buildVercelDeployUrl,
  copyToClipboard,
} from '../utils/urlShortenerLogic';

const REPO_URL = 'https://github.com/Raunaq12/SixDigit';

const VERCEL_CLI_COMMANDS = `# Inside your local SixDigit folder:
git remote set-url origin https://github.com/Raunaq12/SixDigit.git
git add vercel.json api/index.ts server.ts
git commit -m "Add Vercel serverless configuration"
git push origin main

# Or deploy directly from your terminal without pushing:
npx vercel --prod`;

export function VercelDeploySection() {
  const [runtimeMode, setRuntimeMode] = useState<'node' | 'python'>('node');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const vercelConfigJson = JSON.stringify(buildVercelConfig(runtimeMode), null, 2);
  const deployUrl = buildVercelDeployUrl(REPO_URL);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  return (
    <section
      id="vercel-section"
      aria-labelledby="vercel-heading"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <h2 id="vercel-heading" className="text-base font-bold text-slate-900">
            Vercel Deployment Configuration (<code className="font-mono text-sm">Raunaq12/SixDigit</code>)
          </h2>
          <p className="text-xs text-slate-600">
            Import your existing repository on Vercel or deploy directly from your terminal with{' '}
            <code className="font-mono">vercel.json</code> &amp; <code className="font-mono">api/index.ts</code>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <span>Import Existing Repo on Vercel</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <span>GitHub Repo</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setRuntimeMode('node')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  runtimeMode === 'node'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Node Serverless (/api/index)
              </button>
              <button
                type="button"
                onClick={() => setRuntimeMode('python')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  runtimeMode === 'python'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Python FastAPI (/main.py)
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(vercelConfigJson, 'vercel-json')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedKey === 'vercel-json' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  <span>Copied vercel.json</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy vercel.json</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
            {vercelConfigJson}
          </pre>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-900">
                Push to Existing Repo &amp; Deploy
              </span>
              <button
                type="button"
                onClick={() => handleCopy(VERCEL_CLI_COMMANDS, 'vercel-cli')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedKey === 'vercel-cli' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                    <span>Copied Commands</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
              {VERCEL_CLI_COMMANDS}
            </pre>
          </div>

          <div className="space-y-2 text-xs text-slate-600 pt-1">
            <div className="font-semibold text-slate-900">01. Build &amp; Output Settings</div>
            <p>
              Framework Preset: <code className="font-mono text-slate-800">Vite</code> · Build Command:{' '}
              <code className="font-mono text-slate-800">npm run build</code> · Output Directory:{' '}
              <code className="font-mono text-slate-800">dist</code>
            </p>
            <div className="font-semibold text-slate-900 pt-1">02. Serverless Route Rewrites</div>
            <p>
              Requests to <code className="font-mono text-slate-800">POST /shorten</code>,{' '}
              <code className="font-mono text-slate-800">GET /api/*</code>, and 6-digit redirects{' '}
              <code className="font-mono text-slate-800">GET /&#123;short_code&#125;</code> route automatically to{' '}
              <code className="font-mono text-slate-800">
                {runtimeMode === 'node' ? '/api/index.ts' : '/main.py'}
              </code>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
