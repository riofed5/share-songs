import type { Metadata } from "next";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "Request a song" };

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Request a song
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Tell us what you would like to hear and we will add it to the list.
        </p>
      </div>
      <RequestForm />
    </main>
  );
}
