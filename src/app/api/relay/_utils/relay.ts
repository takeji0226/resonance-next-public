/**
 * relay.ts
 * -----------------------------------------------------------------------------
 * Next.js Route Handler から Rails API へ安全にリレーする共通関数。
 * 役割:
 *  - HttpOnly Cookie の token をサーバ側で取得し、Authorization: Bearer に付け替える。
 *  - CORS や CSRF をブラウザから見えない位置に押し込める（BFFパターン）。
 * 注意:
 *  - API_BASE はサーバ環境変数から。クライアント公開不要（NEXT_PUBLIC は最小限に）。
 *  - タイムアウトやエラー文言は本番に合わせて調整すること。
 */

import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!; // 共有しているならこれでOK。将来はサーバ専用ENVを推奨。
const TIMEOUT_MS = 10000;

export async function relayToRails(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string, // 例: "/api/onboarding/start"
  init?: { body?: string | null; headers?: HeadersInit }
): Promise<Response> {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ★ ここが肝：Cookie→Bearer に付け替える
        ...(init?.headers ?? {}),
      },
      body: init?.body ?? null,
      cache: "no-store",
      signal: ctrl.signal,
    });

    // Rails のレスポンスをそのまま透過（Content-Type を尊重）
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (e: any) {
    const msg =
      e?.name === "AbortError"
        ? "upstream timeout"
        : (e?.message ?? "relay error");
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    clearTimeout(t);
  }
}
