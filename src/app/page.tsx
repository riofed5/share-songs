import type { Metadata } from "next";
import { env } from "@/lib/env";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "Request a song" };

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <RequestForm googleReviewUrl={env.googleReviewUrl()} />
    </main>
  );
}
