"use client";

import { useEffect, useState } from "react";

const SHOW_COPIED_MS = 1500;

/**
 * The clipboard API only exists on https (and localhost), so opening the
 * admin page over a plain local address falls back to the older copy call.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  }
}

export function CopyButton({ text, className }: { text: string; className: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const id = setTimeout(() => setStatus("idle"), SHOW_COPIED_MS);
    return () => clearTimeout(id);
  }, [status]);

  return (
    <button
      type="button"
      onClick={async () => setStatus((await copyText(text)) ? "copied" : "failed")}
      className={className}
    >
      {/* The hidden "Copied" holds the width so the row doesn't jump. */}
      <span className="grid">
        <span className="invisible col-start-1 row-start-1" aria-hidden="true">
          Copied
        </span>
        <span className="col-start-1 row-start-1" aria-live="polite">
          {status === "copied" ? "Copied" : status === "failed" ? "Failed" : "Copy"}
        </span>
      </span>
    </button>
  );
}
