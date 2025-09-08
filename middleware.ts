import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 期限切れチェック
function isExpiredJwt(token: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString("utf-8")
    );
    if (!payload?.exp) return true; // exp が無ければ無効扱い
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec; // 期限切れ？
  } catch {
    return true; // パース失敗＝無効
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // 静的ファイル・画像・API は除外
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }
  // ログインページ自体は素通り
  if (pathname === "/login") return NextResponse.next();

  const token = req.cookies.get("token")?.value;

  // トークンが存在しない、または期限切れならログイン画面に遷移
  if (!token || isExpiredJwt(token)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
