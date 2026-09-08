import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Song requests</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Sign in to see what people have asked for.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
