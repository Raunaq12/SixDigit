interface HeaderProps {
  onOpenBackendModal: () => void;
}

export function Header({ onOpenBackendModal }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-slate-200">
      <a
        href="#shorten-section"
        className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
      >
        SixDigit
      </a>

      <nav
        aria-label="Primary navigation"
        className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
      >
        <a
          href="#shorten-section"
          className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Shorten
        </a>
        <a
          href="#directory-section"
          className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Directory
        </a>
        <a
          href="#lookup-section"
          className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Lookup
        </a>
        <a
          href="#vercel-section"
          className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Vercel Deploy
        </a>
        <a
          href="#spec-section"
          className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          FastAPI Spec
        </a>
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenBackendModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Backend Setup
        </button>
      </div>
    </header>
  );
}
