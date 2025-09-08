// src/app/api/auth/login/route.ts
import { cookies } from "next/headers";

export async function GET() {
  // ルート認識のデバッグ用
  return new Response(JSON.stringify({ ok: true, method: "GET" }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

export async function POST(req: Request) {
  // 入力取得（JSON/FORM 両対応）
  const ctype = req.headers.get("content-type") || "";
  let email = "", password = "", nextUrl = "/";

  if (ctype.includes("application/json")) {
    const body = await req.json().catch(() => ({} as any));
    email = body?.email ?? "";
    password = body?.password ?? "";
    nextUrl = body?.next || "/";
  } else {
    const form = await req.formData();
    email = String(form.get("email") || "");
    password = String(form.get("password") || "");
    nextUrl = String(form.get("next") || "/");
  }

  if (!email || !password) {
    return Response.json({ error: "missing_credentials" }, { status: 400 });
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (!apiBase) {
    return Response.json({ error: "missing_NEXT_PUBLIC_API_BASE" }, { status: 500 });
  }

  // Rails（/users/sign_in）へ中継
  const railsRes = await fetch(`${apiBase}/users/sign_in`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ user: { email, password } }),
  });

  if (!railsRes.ok) {
    return Response.json({ error: "invalid_credentials" }, { status: 401 });
  }

  // Authorization: Bearer <JWT> を Cookie に保存
  const auth = railsRes.headers.get("Authorization");
  if (!auth) {
    return Response.json({ error: "no_auth_header_from_backend" }, { status: 500 });
  }
  const token = auth.replace(/^Bearer\s+/i, "");

  (await cookies()).set({
    name: "token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return Response.json({ ok: true, next: nextUrl }, { status: 200 });
}
