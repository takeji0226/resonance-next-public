// Server Component: 認証トークンを用いたサーバ側フェッチで 401 を回避する。
// - 役割: 認証チェック、オンボーディング状態の取得、思想本文の事前取得。
// - 注意: クライアントから philosophy を直接叩かない（devise-jwt が Authorization: Bearer を要求するため）。

import Header from "@components/Header";
import ChatWindow from "@components/ChatWindow";
import { cookies } from "next/headers";
import Sidebar from "@components/Sidebar";
import BlankPane from "@components/BlankPane";
import { redirect } from "next/navigation";
import OnboardingGate from "@components/OnboardingGate";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

// ---- Server-only fetchers ----------------------------------------------------
// サーバ側から Bearer を付けて叩くことで、devise-jwt 環境でも 401 を防ぐ。

async function fetchOnboardingStatus(token?: string) {
  const headers: HeadersInit = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`; // 認証が必要なため付与
  const res = await fetch(`${API_BASE}/api/onboarding/status`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) return { stage: "done" }; // フェイルセーフ: 画面が詰まらないように done 扱い
  return res.json() as Promise<{
    stage: string;
    cycles_done: number;
    cycles_target: number;
  }>;
}

export const dynamic = "force-dynamic"; // SSR で Cookie を確実に使う
export const revalidate = 0;

async function getHealthWithAuth(token: string) {
  const res = await fetch(`${API_BASE}/health`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) redirect("/login");
  return res.json();
}

// API: /api/me で本人性を確認（サーバ側から Bearer 付与）
async function fetchMe(token?: string) {
  const headers: HeadersInit = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/me`, { headers, cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; name: string; email: string }>;
}

// ---- Page --------------------------------------------------------------------
// - 初期レンダリング時に必要情報をサーバで取り切る。
// - showOverlay=true の場合のみ思想本文を先読みして Overlay へ渡す（B案のポイント）。

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ pane?: string }>;
}) {
  // 認証トークンの取得（Cookie 由来）。Bearer で下流 API を叩くために使う。
  const token = (await cookies()).get("token")?.value;

  // 本人性チェック（未ログインなら /login へ）
  const me = await fetchMe(token);
  if (!me) redirect("/login");
  if (!token) redirect("/login");

  // 右ペイン種別
  const sp = await searchParams;
  const pane = sp?.pane ?? "chat";
  const uid = (await cookies()).get("uid")?.value;

  // オンボーディング状態をサーバ側で取得（Bearer 付き）
  const status = await fetchOnboardingStatus(token);
  const showOverlay = status.stage !== "done";

  // 右ペイン分岐（UI 構造だけなので説明は最小に）
  const RightPane =
    pane === "chat" ? (
      <ChatWindow uid={uid} />
    ) : pane === "timeline" ? (
      <BlankPane title="前に進む" />
    ) : pane === "record" ? (
      <BlankPane title="自分を知る" />
    ) : (
      <BlankPane title="未定義のページ" />
    );

  // 画面主要部
  return (
    <>
      <Header />
      <main
        style={{
          display: "flex",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 8,
          padding: 2,
          marginRight: "auto",
        }}
      >
        <section
          style={{
            width: "10%",
            maxWidth: "10%",
          }}
        >
          <Sidebar active={pane} />
        </section>

        <section
          style={{
            width: "85%",
            maxWidth: "85%",
            boxSizing: "border-box",
            marginLeft: "auto",
          }}
        >
          {/* Overlay直呼び → Gateで表示制御 */}
          <OnboardingGate initialVisible={showOverlay} />
          {RightPane}
        </section>
      </main>
    </>
  );
}
