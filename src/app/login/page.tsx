// app/login/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE = process.env.NEXTSELF_PUBLIC_API_BASE!;

/** サーバーアクション：RailsにPOST → AuthorizationヘッダーからJWTを取得 → httpOnlyクッキー保存 → リダイレクト */
async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/");

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password, next: nextPath }),
    cache: "no-store",
  });

  if (!res.ok) {
    redirect(`/login?e=invalid_credentials`);
  }

  // Devise-jwt が返す Authorization: Bearer <token>
  const auth =
    res.headers.get("authorization") || res.headers.get("Authorization");
  const token = auth?.replace(/^Bearer\s+/i, "");
  if (!token) {
    redirect(`/login?e=no_token`);
  }

  // httpOnly クッキーに保存（middleware/サーバーコンポーネントから参照可能）
  (
    await // httpOnly クッキーに保存（middleware/サーバーコンポーネントから参照可能）
    cookies()
  ).set("token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 24h（devise.rbのexpiration_timeと揃えると良い）
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect(nextPath);
}

export default async function LoginPage({
  searchParams,
}: {
  // ★ Next.js 15: searchParams は Promise 型
  searchParams: Promise<{ e?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const error = sp?.e;
  const next = sp?.next ?? "/";

  const errMsg =
    error === "invalid_credentials"
      ? "メールアドレスまたはパスワードが違います。"
      : error === "no_token"
        ? "サーバからトークンが受け取れませんでした。"
        : null;

  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <form
        action={loginAction}
        style={{ width: 320, display: "grid", gap: 12 }}
      >
        <h1>ログイン</h1>

        <input
          name="email"
          type="email"
          placeholder="メールアドレス"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="パスワード"
          required
        />
        {/* ログイン後の遷移先（/login?next=/xxx から引き継ぎ） */}
        <input type="hidden" name="next" value={next} />

        <button type="submit">Sign in</button>

        {errMsg && <p style={{ color: "crimson" }}>{errMsg}</p>}
      </form>
    </main>
  );
}
