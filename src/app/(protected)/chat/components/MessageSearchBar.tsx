'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { MessageSearchResult } from '@/types/message';

interface MessageSearchBarProps {
  query: string;
  results: MessageSearchResult[];
  onQueryChange: (value: string) => void;
  onClear: () => void;
  onSelectResult: (messageId: string) => void;
  timeFormatter: Intl.DateTimeFormat;
}

export function MessageSearchBar({
  query,
  results,
  onQueryChange,
  onClear,
  onSelectResult,
  timeFormatter,
}: MessageSearchBarProps) {
  return (
    <div className="border-b border-slate-200 bg-white/70 px-4 py-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search in this conversation"
            className="w-full border-none bg-slate-100 pl-9 pr-9 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-blue-400"
          />
          {query && (
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-600"
              onClick={onClear}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {query && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-72 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-xl">
              {results.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500">No messages matched “{query}”.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {results.map((result) => (
                    <li key={result.message.id}>
                      <button
                        type="button"
                        onClick={() => onSelectResult(result.message.id)}
                        className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-slate-50"
                      >
                        <span
                          className="text-sm font-medium text-slate-700"
                          dangerouslySetInnerHTML={{ __html: result.highlightedText }}
                        />
                        <span className="text-xs text-slate-400">
                          {timeFormatter.format(new Date(result.message.createdAt))}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px] shadow-emerald-100" />
          Messages sync instantly across your devices
        </div>
      </div>
    </div>
  );
}
