import React, { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';
import { copyToClipboard } from '../utils/urlShortenerLogic';

interface BackendSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl: string;
  onChangeApiBaseUrl: (newUrl: string) => void;
}

const FASTAPI_CORS_CODE = `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import secrets
import string
from pydantic import BaseModel

app = FastAPI()

# Allow the frontend browser app to call http://localhost:8000 directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLRequest(BaseModel):
    url: str

def generate_short_code():
    characters = string.digits
    code = ''.join(secrets.choice(characters) for _ in range(6))
    return code

url_store: dict[str, str] = {}

@app.post('/shorten')
def shorten_url(request: URLRequest):
    short_code = generate_short_code()
    url_store[short_code] = request.url
    return {"short_url": f"http://localhost:8000/{short_code}"}

@app.get('/{short_code}')
def get_url(short_code: str):
    if short_code in url_store:
        return RedirectResponse(url=url_store[short_code])
    else:
        raise HTTPException(status_code=404, detail="URL not found.")`;

export function BackendSetupModal({
  isOpen,
  onClose,
  apiBaseUrl,
  onChangeApiBaseUrl,
}: BackendSetupModalProps) {
  const [urlDraft, setUrlDraft] = useState(apiBaseUrl);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = urlDraft.trim().replace(/\/+$/, '') || 'http://localhost:8000';
    onChangeApiBaseUrl(cleaned);
    onClose();
  };

  const handleCopyCode = async () => {
    await copyToClipboard(FASTAPI_CORS_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backend-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="backend-modal-title" className="text-base font-bold text-slate-900">
            FastAPI Backend Connection &amp; CORS Configuration
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Backend Setup dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          <form onSubmit={handleSave} className="space-y-3">
            <label htmlFor="fastapi-url-input" className="block text-xs font-semibold text-slate-900">
              FastAPI Base URL
            </label>
            <div className="flex gap-2">
              <input
                id="fastapi-url-input"
                type="url"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Save Endpoint
              </button>
            </div>
            <p className="text-xs text-slate-500">
              The frontend calls <code className="font-mono">{urlDraft || 'http://localhost:8000'}/shorten</code> directly and automatically falls back to the built-in FastAPI mirror route when running inside this cloud preview or on Vercel.
            </p>
          </form>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">
                Your main.py with CORSMiddleware enabled (run with: uvicorn main:app --reload --port 8000)
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                    <span>Copied main.py</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy main.py</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
              {FASTAPI_CORS_CODE}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
