'use client';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveProgressButtonProps {
  status: SaveStatus;
  onClick: () => void;
  className?: string;
}

/**
 * Standalone "Save Progress" button with inline status feedback.
 * - idle    → grey outline button
 * - saving  → spinner + "Saving…"
 * - saved   → green check + "Saved!"
 * - error   → red outline + "Save failed"
 */
export default function SaveProgressButton({ status, onClick, className = '' }: SaveProgressButtonProps) {
  const isBusy = status === 'saving';

  const baseClasses =
    'inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses: Record<SaveStatus, string> = {
    idle:   'border-gray-300 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-400',
    saving: 'border-[#c653a0] text-[#c653a0] bg-white cursor-not-allowed opacity-70',
    saved:  'border-green-500 text-green-700 bg-green-50',
    error:  'border-red-400 text-red-600 bg-red-50',
  };

  const label: Record<SaveStatus, string> = {
    idle:   'Save Progress',
    saving: 'Saving…',
    saved:  'Saved!',
    error:  'Save failed',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isBusy}
      aria-label={label[status]}
      className={`${baseClasses} ${variantClasses[status]} ${className}`}
    >
      {status === 'saving' && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {status === 'saved' && (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {status === 'error' && (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {status === 'idle' && (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      )}
      {label[status]}
    </button>
  );
}
