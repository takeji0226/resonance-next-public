/**
 * OnboardingOverlay (centered prose / inline text version)
 * -----------------------------------------------------------------------------
 * 目的:
 *  - 初回ユーザに「サービスの思想」を“中央寄せの読み物”として提示する。
 *  - 「小石を投げる」クリック時に **即座にオーバーレイを閉じるだけ**。
 *
 * 方針:
 *  - タイトルと本文はこのファイルに「直書き」する（API 取得しない）。
 *  - 画面上部に大きめタイトル、本文は段落ごとに中央寄せで表示。
 *  - ドロップキャップなど過度な装飾は行わない。
 *
 * 注意:
 *  - 表示/非表示は props.visible で親が制御する（本コンポーネントは受動）。
 *  - onFinish は「閉じる」動作を親に依頼するためのコールバック。
 *    クリック時に即 onFinish を呼ぶため、**ネットワーク結果に依存せず閉じる**。
 *  - /start /pebble をここで実行しない設計に変更したため、CORS/認証等の注意は
 *    親側（例: OnboardingGate）での fetch 実装に移譲すること。
 */
"use client";

import { useMemo, useState } from "react";

type Props = {
  visible: boolean; // 表示トグル（stage !== "done" 時に true）
  onFinish?: () => void; // オーバーレイを閉じたい時に呼ぶコールバック
};

export default function OnboardingOverlay({ visible, onFinish }: Props) {
  //　onboarding_Stageがfalseならば表示しない
  if (!visible) return null;

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
      "まずは、小さな一歩から試してみませんか？",
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
            onClick={() => onFinish?.()}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid #111827",
              background: "#111827",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              minWidth: 140,
            }}
            aria-label="はじめる"
            title="さっそくはじめる"
          >
            さっそく始める
          </button>
        </div>
      </div>
    </div>
  );
}
