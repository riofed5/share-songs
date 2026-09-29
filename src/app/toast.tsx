"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SHOW_FOR_MS = 4500;

type ToastState = { id: number; message: string } | null;

/**
 * A single message that drops in from the top of the screen and leaves on
 * its own. Showing a new one replaces the old and restarts its animation.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((message: string) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message });
    timer.current = setTimeout(() => setToast(null), SHOW_FOR_MS);
  }, []);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, show, dismiss };
}

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div
        key={toast.id}
        role="alert"
        className="toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-white dark:text-black"
      >
        <svg
          viewBox="0 0 24 24"
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 dark:text-amber-600"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="flex-1">{toast.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-my-1 -mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/60 hover:text-white dark:text-black/50 dark:hover:text-black"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
