"use client";

import { useActionState, useState } from "react";
import { submitRequest, type SubmitState } from "./actions";

const initial: SubmitState = { status: "idle", error: null };

function SongForm({ onSent }: { onSent: () => void }) {
  const [state, formAction, pending] = useActionState(submitRequest, initial);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <p className="text-lg font-medium">
          Thanks! We have got your song request.
        </p>
        <button
          type="button"
          onClick={onSent}
          className="rounded-md bg-black px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          Send another song
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">
          What song would you like to hear?
        </span>
        <input
          name="song"
          required
          maxLength={200}
          autoComplete="off"
          className="rounded-md border border-black/15 bg-white px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:bg-white/5"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">
          Where have you come from? (optional)
        </span>
        <input
          name="cameFrom"
          maxLength={100}
          autoComplete="off"
          className="rounded-md border border-black/15 bg-white px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:bg-white/5"
        />
      </label>

      {state.status === "error" && state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Sending…" : "Send song request"}
      </button>
    </form>
  );
}

export function RequestForm() {
  const [formKey, setFormKey] = useState(0);

  return (
    <SongForm key={formKey} onSent={() => setFormKey((key) => key + 1)} />
  );
}
