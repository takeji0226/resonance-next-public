/**
 * OnboardingOverlay (centered prose / inline text version)
 * -----------------------------------------------------------------------------
 * 目的:
 *  - 初回ユーザに「サービスの思想」を“中央寄せの読み物”として提示し、
 *    「小石を投げる」クリックで /start → /pebble を実行し、最初の問いを
 *    ChatWindow へ受け渡す。
 *
 * 方針:
 *  - タイトルと本文はこのファイルに「直書き」する（API 取得しない）。
 *  - 画面上部に大きめタイトル、本文は段落ごとに中央寄せで表示。
 *  - 先頭1文字の強調（ドロップキャップ）は行わない。
 *
 * 注意:
 *  - /start /pebble はユーザ認証と CORS 設定が前提。別オリジンの場合は
 *    Rails 側の CORS(credentials:true) とクライアント fetch の
 *    credentials:"include" を必ず揃えること。
 *  - onFinish はオーバーレイを閉じたいときに親から渡す。未指定でも動作は可能。
 */

"use client";

import { useMemo, useState } from "react";

type Props = {
  visible: boolean; // 表示トグル（stage !== "done" 時に true）
  onFinish?: () => void; // オーバーレイを閉じたい時に呼ぶコールバック
  pushToChat?: (text: string) => void; // 最初の問いを直接チャットに差し込みたい場合
};

export default function OnboardingOverlay({
  visible,
  onFinish,
  pushToChat,
}: Props) {
  const [loading, setLoading] = useState(false); // /start, /pebble の実行中フラグ
  const [error, setError] = useState<string | null>(null); // 通信失敗の簡易表示

  // --- 表示テキスト（直書き） -------------------------------------------------------
  // 理由: API 依存をやめ、確実に同一の内容を即表示するため。
  const title =
    "あなたは、一生かけて注力できるものに出会える“続けやすい仕組み”があるとしたら、知りたいですか？";

  const paragraphs = useMemo(
    () => [
      "「そんなもの、本当に見つかるの？」そう思うのは自然です。",
      "多くの人は「そのうち奇跡的に出会う」と信じて待っています。でも実際は──一生をかけられるものは、日々の小さな言葉の積み重ねからしか現れません。",
      "レゾナンスは、その積み重ねを支える仕組みです。一人きりのメモでは続かない。セミナーや研修は一時的で忘れてしまう。だからこそ、毎日の会話の中で少しずつ言葉にする。",
      "それが君の望みを浮かび上がらせ、やがて確信に変わる。そして職場で発揮され、社会へと広がっていく。",
      "まずは、小さな一歩から試してみませんか？──「小石を投げる」をクリックしてください。",
    ],
    []
  );

  // 段落のスタイルは読みやすさ優先で統一（自明な指定は避ける）
  const pStyle: React.CSSProperties = {
    textAlign: "center",
    maxWidth: 720,
    margin: "8px auto",
    lineHeight: 1.9,
    fontSize: 15,
    color: "#1f2937",
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  };

  // --- 小石アクション: /start → /pebble → ChatWindow へ渡す -------------------------
  // 理由: 既存の会話サイクル開始導線を維持。/start でサイクル数を確定 → /pebble で初問取得。
  // 注意: 401/CSRF/CORSで失敗しやすい層。エラーは簡潔に提示してユーザを詰まらせない。
  async function handlePebble() {
    setLoading(true);
    setError(null);
    try {
      const st = await fetch(`/api/relay/onboarding/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!st.ok) throw new Error(`start ${st.status}`);

      const res = await fetch(`/api/relay/onboarding/pebble`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error(`pebble ${res.status}`);

      const data = (await res.json()) as { question?: string };
      const q = data?.question || "（初期問いが未登録です）";

      if (pushToChat) {
        pushToChat(q);
      } else {
        // 既存の ChatWindow 連携（CustomEvent）
        window.dispatchEvent(
          new CustomEvent("onboarding:first-question", { detail: { text: q } })
        );
      }

      onFinish?.(); // オーバーレイを閉じる（親で visible を false にする想定）
    } catch (e: any) {
      setError(e?.message ?? "小石の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  // --- レンダリング ---------------------------------------------------------------
  // 役割: タイトルを上部中央に、本文は段落で中央寄せ。フッタに「小石を投げる」。
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#ffffff",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(900px, 92vw)",
          maxHeight: "86vh",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          padding: "32px 28px 20px",
        }}
      >
        {/* タイトル: 画面上部に少し大きめで、中央表示。 */}
        <h1
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: 700,
            lineHeight: 1.4,
            margin: "0 0 18px",
            wordBreak: "keep-all",
          }}
        >
          {title}
        </h1>

        {/* 本文: 段落をすべて同一スタイルで中央寄せ表示。 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "4px 6px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {paragraphs.map((p, i) => (
            <p key={i} style={pStyle}>
              {p}
            </p>
          ))}

          {loading && (
            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>
              通信中…
            </div>
          )}
          {error && (
            <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 8 }}>
              {error}
            </div>
          )}
        </div>

        {/* フッタ: 「小石を投げる」ボタン（中央寄せ）。 */}
        <div
          style={{
            paddingTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <button
            onClick={handlePebble}
            disabled={loading}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid #111827",
              background: loading ? "#d1d5db" : "#111827",
              color: "#fff",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              minWidth: 140,
            }}
            aria-label="小石を投げる"
            title="小石を投げる"
          >
            小石を投げる
          </button>
        </div>
      </div>
    </div>
  );
}
