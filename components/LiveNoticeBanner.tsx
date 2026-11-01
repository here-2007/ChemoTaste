// components/LiveNoticeBanner.tsx
'use client';

import React from 'react';
import { CheckCircle2, Info, AlertCircle, X, ArrowRight } from 'lucide-react';

export type LiveNoticeType = 'success' | 'info' | 'error';

export interface LiveNotice {
  type: LiveNoticeType;
  message: string;
}

interface Props {
  notice: LiveNotice | null;
  onDismiss: () => void;
  onViewLive?: () => void;
}

export const LiveNoticeBanner: React.FC<Props> = ({ notice, onDismiss, onViewLive }) => {
  if (!notice) return null;

  const isSuccess = notice.type === 'success';
  const isError = notice.type === 'error';
  const role = isError ? 'alert' : 'status';
  const ariaLive = isError ? 'assertive' : 'polite';

  return (
    <div
      role={role}
      aria-live={ariaLive}
      data-testid="live-notice-banner"
      data-notice-type={notice.type}
      className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 transition-all ${
        isSuccess
          ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
          : isError
          ? 'bg-red-950/25 border-red-500/40 text-red-200'
          : 'bg-sky-950/25 border-sky-500/40 text-sky-200'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {isSuccess && (
          <CheckCircle2
            className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5"
            data-testid="icon-success"
          />
        )}
        {notice.type === 'info' && (
          <Info
            className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5"
            data-testid="icon-info"
          />
        )}
        {isError && (
          <AlertCircle
            className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
            data-testid="icon-error"
          />
        )}
        <div className="leading-relaxed">
          <span
            className={`font-semibold mr-1.5 ${
              isSuccess
                ? 'text-emerald-300'
                : isError
                ? 'text-red-300'
                : 'text-sky-300'
            }`}
          >
            {isSuccess
              ? 'Live Gateway Connected:'
              : isError
              ? 'Gateway Fallback Notice:'
              : 'Gateway Notice:'}
          </span>
          <span>{notice.message}</span>
          {isSuccess && onViewLive && (
            <button
              type="button"
              onClick={onViewLive}
              data-testid="banner-view-live-btn"
              className="ml-2 inline-flex items-center gap-0.5 font-semibold text-emerald-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              <span>View live recipes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className={`p-1 rounded-md transition-colors flex-shrink-0 ${
          isSuccess
            ? 'text-emerald-400/60 hover:text-emerald-300 hover:bg-emerald-900/30'
            : isError
            ? 'text-red-400/60 hover:text-red-300 hover:bg-red-900/30'
            : 'text-sky-400/60 hover:text-sky-300 hover:bg-sky-900/30'
        }`}
        aria-label="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
