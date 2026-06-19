'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Check if the error is due to chunk/loading failure
    const msg = error?.message || '';
    if (
      msg.includes('ChunkLoadError') ||
      msg.includes('Loading chunk') ||
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Failed to fetch')
    ) {
      console.warn('Chunk load error detected inside error boundary, triggering auto-reload...');
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center font-sans">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-card space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-foreground">Ocorreu um erro ao carregar a página</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Houve uma falha ao obter os ficheiros mais recentes do servidor. Isso pode acontecer se
            uma nova versão do Nzila tiver sido publicada recentemente.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-accent active:scale-95 transition-all duration-150 shadow-sm"
          >
            Recarregar Página
          </button>
          <button
            onClick={() => reset()}
            className="flex-1 px-5 py-3 border border-border text-foreground hover:bg-muted font-semibold rounded-xl text-sm transition-all duration-150"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}
