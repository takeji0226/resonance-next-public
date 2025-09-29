// src/app/api/auth/route.ts
/**
 * route.ts
 * -----------------------------------------------------------------------------
 * 役割:
 *  - Next.js 側の「認証ゲートウェイ」単一エンドポイント (/api/auth)。
 *  - クエリ `?to=/api/chat` のように叩くと、Rails 側 `${API_BASE}/api/chat` へ中継する。
 *  - HttpOnly Cookie("token") から JWT を取り出し、Authorization: Bearer を付与する。
 * 理由:
 *  - Rails のユーザ保護リソースを叩く際は **必ずここを経由**して認証を一元化したいニーズに対応。
 * 注意:
 *  - `to` は `/api/` で始まるパスのみ許可（任意の外部へは飛ばさない安全弁）。
 *  - 許可HTTPメソッドは GET/POST/PUT/PATCH/DELETE のみ。
 *  - 追加ヘッダが必要な場合はここで集約して付与する（CSP/Trace等）。
 *  - エラー時は統一フォーマット { error, hint? } を返す。
 */

import { cookies, headers as nextHeaders } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!; // 例: http://localhost:3001
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

function json(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
export async function PUT(req: Request) {
  return handle(req);
}
export async function PATCH(req: Request) {
  return handle(req);
}
export async function DELETE(req: Request) {
  return handle(req);
}

async function handle(req: Request) {
  try {
    // --- 1) メソッド制限
    const method = req.method.toUpperCase();
    if (!ALLOWED_METHODS.has(method)) {
      return json(405, { error: "method_not_allowed" });
    }

    // --- 2) 転送先パスの決定
    const url = new URL(req.url);
    const to = url.searchParams.get("to") || "";
    if (!to || !to.startsWith("/api/")) {
      return json(400, {
        error: "invalid_to",
        hint: "?to=/api/... を指定してください",
      });
    }

    // 残りのクエリはそのまま転送
    url.searchParams.delete("to");
    const forwardQS = url.searchParams.toString();
    const forwardUrl = `${API_BASE}${to}${forwardQS ? `?${forwardQS}` : ""}`;

    // --- 3) 認証トークンの取り出し（HttpOnly Cookie）
    const token = (await cookies()).get("token")?.value;
    if (!token) return json(401, { error: "unauthorized" });

    // --- 4) ボディ取り出し
    //   - JSON 文字列で受けてそのまま転送（Bodyが無ければ undefined）
    const hasBody = !(method === "GET" || method === "HEAD");
    const bodyText = hasBody ? await req.text() : undefined;

    // --- 5) 転送ヘッダの構築
    const h = new Headers();
    // Acceptは基本JSON。必要ならここで増やす
    h.set("Accept", "application/json");
    // BodyがあるときのみContent-Typeを補う（クライアントが指定していなければ）
    const reqCT = req.headers.get("content-type");
    if (hasBody) h.set("Content-Type", reqCT || "application/json");
    // 認証
    h.set("Authorization", `Bearer ${token}`);
    // 元のトレース情報を必要に応じて転送（例：x-request-id 等）
    const incoming = await nextHeaders();
    const xrid = incoming.get("x-request-id");
    if (xrid) h.set("x-request-id", xrid);

    // --- 6) Railsへ中継
    const res = await fetch(forwardUrl, {
      method,
      headers: h,
      body: bodyText,
      cache: "no-store",
    });

    // --- 7) レスポンスをそのまま返却
    const contentType = res.headers.get("Content-Type") ?? "application/json";
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (e: any) {
    return json(500, { error: "unexpected", message: String(e?.message || e) });
  }
}
