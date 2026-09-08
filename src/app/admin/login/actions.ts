"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import {
  SESSION_COOKIE,
  makeToken,
  safeEqual,
  sessionCookieOptions,
} from "@/lib/session";

export type LoginState = { error: string | null };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const user = String(formData.get("user") ?? "");
  const password = String(formData.get("password") ?? "");

  let expectedUser: string;
  let expectedPassword: string;
  try {
    expectedUser = env.adminUser();
    expectedPassword = env.adminPassword();
    env.sessionSecret();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Setup is incomplete." };
  }

  // Both compares always run, so a wrong username and a wrong password take
  // the same amount of time.
  const userOk = safeEqual(user, expectedUser);
  const passwordOk = safeEqual(password, expectedPassword);
  if (!userOk || !passwordOk) {
    return { error: "That username or password is not right." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, makeToken(), sessionCookieOptions);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
