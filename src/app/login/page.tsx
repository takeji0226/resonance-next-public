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

  /**next.js内の /api/auth/login/route.tsにログイン処理を委譲*/
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password, next: nextPath }),
    cache: "no-store",
  });

  // /api/auth/login が Cookie へ保存する設計。ここでは結果だけ見る
  const data = await res.json().catch(() => ({}) as any);
  if (!res.ok) {
    const code = data?.error ?? "invalid_credentials";
    redirect(`/login?e=${code}`);
  }
  redirect(data?.next ?? nextPath);
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
