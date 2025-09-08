"use client";

/**
 * ChatWindow
 * -----------------------------------------------------------------------------
 * 役割:
 *  - 通常チャットとオンボーディング（初期サイクル）を同じUIで扱う。
 *  - オンボーディング開始時は OnboardingOverlay からの CustomEvent を受け取り、
 *    “最初の問い”をアシスタント発言として差し込む。
 *  - オンボーディング中の送信は BFF 経由で /onboarding/reply → done なら /finish を叩き、
 *    まとめ（信念/好き/得意）をチャットに掲示して通常モードへ戻す。
 *
 * 注意:
 *  - BFF（/api/relay/...）を使うことで CORS/CSRF/Authorization を吸収。
 *  - サーバ側が { assistant_reply, done } を返す前提。done===true で finish を呼ぶ。
 */

import { useEffect, useMemo, useRef, useState } from "react";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function ChatWindow({ uid }: { uid?: string }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "こんにちは。右側がチャット領域です。オンボーディングの最初の問いは、上の「小石を投げる」で表示されます。",
    },
  ]);
  const [input, setInput] = useState("");
  // オンボーディングの間だけ送信先を切替える
  const [mode, setMode] = useState<"normal" | "onboarding">("normal");
  const listRef = useRef<HTMLDivElement>(null);

  // 入力エリアのオートリサイズ
  const taRef = useRef<HTMLTextAreaElement>(null);
  const MIN_H = 25;
  const MAX_H = 140;

  function autosize() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX_H);
    el.style.height = `${Math.max(next, MIN_H)}px`;
  }

  useEffect(() => {
    autosize();
  }, [input]);

  const canSend = input.trim().length > 0;

  // 新着メッセージで下端へスクロール
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  // オンボーディング開始（小石→pebble完了）: 最初の問いを受け取って表示
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { text: string };
      if (!detail?.text) return;
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: detail.text },
      ]);
      setMode("onboarding");
    };
    window.addEventListener(
      "onboarding:first-question",
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        "onboarding:first-question",
        handler as EventListener
      );
  }, []);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSend) return;

    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // 送信後クリア
    setInput("");
    requestAnimationFrame(() => {
      const el = taRef.current;
      if (el) el.style.height = `${MIN_H}px`;
    });

    // 通常: Rails `/api/chat`。オンボーディング中は BFF 経由で `/onboarding/reply`。
    let assistantText = "";
    try {
      if (mode === "onboarding") {
        // --- オンボーディング返信（BFF経由） ---
        const res = await fetch(`/api/relay/onboarding/reply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            uid,
            message: userMsg.content,
            history: messages.map(({ role, content }) => ({ role, content })),
          }),
        });
        if (!res.ok) throw new Error(`reply ${res.status}`);
        const data = await res.json();

        assistantText =
          typeof data?.assistant_reply === "string"
            ? data.assistant_reply
            : JSON.stringify(data);

        // まず返信を表示
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: assistantText,
          },
        ]);

        // サイクル終了ならまとめを取得して掲示 → 通常モードへ戻す
        if (data?.done) {
          try {
            const fin = await fetch(`/api/relay/onboarding/finish`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            });
            if (fin.ok) {
              const summary = await fin.json(); // { beliefs:[], likes:[], strengths:[] } を想定
              const summaryLines = [
                "— ここまでのまとめ —",
                `信念: ${Array.isArray(summary.beliefs) ? summary.beliefs.join(" / ") : "-"}`,
                `好き: ${Array.isArray(summary.likes) ? summary.likes.join(" / ") : "-"}`,
                `得意: ${Array.isArray(summary.strengths) ? summary.strengths.join(" / ") : "-"}`,
              ].join("\n");
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: summaryLines,
                },
              ]);
            }
          } finally {
            setMode("normal");
          }
        }
        // オンボーディングはここで終了（通常チャットの追記はしない）
        return;
      } else {
        // --- 通常チャット（既存APIがあるとき） ---
        if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not set");
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            message: userMsg.content,
            history: messages.map(({ role, content }) => ({ role, content })),
          }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        assistantText =
          typeof data?.reply === "string" ? data.reply : JSON.stringify(data);
      }
    } catch {
      assistantText = `（仮返信）「${userMsg.content}」を受け取りました。${
        mode === "onboarding"
          ? "（/api/relay/onboarding/reply の応答待ち）"
          : "/api/chat が用意できたら実際の応答に差し替わります。"
      }`;
    }

    // 通常チャットのみ、ここでアシスタント発言を追加（オンボーディングは上で追加済み）
    if (mode !== "onboarding") {
      const botMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantText,
      };
      setMessages((prev) => [...prev, botMsg]);
    }
  }

  const placeholder = useMemo(
    () =>
      uid ? "メッセージを入力..." : "まずヘッダーでユーザを選択してください",
    [uid]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "90vh",
        minHeight: 420,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "#f8fafc",
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: m.role === "user" ? "80%" : "100%",
              padding: "10px 12px",
              borderRadius: 12,
              background: m.role === "user" ? "#E0E0E0" : "#f9f8f8ff",
              color: m.role === "user" ? "#222222" : "#444444",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {m.content}
          </div>
        ))}
      </div>

      {/* 入力フォーム */}
      <form
        onSubmit={send}
        style={{
          padding: 12,
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "nowrap",
        }}
      >
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            autosize();
          }}
          placeholder={placeholder}
          disabled={!uid}
          rows={1}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: MIN_H,
            maxHeight: MAX_H,
            height: "25px", // ← 単位表記の微修正
            padding: "5px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            outline: "none",
            resize: "none",
            overflowY: "auto",
            lineHeight: "20px",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (e.shiftKey) {
                e.preventDefault();
                const el = e.currentTarget;
                const { selectionStart, selectionEnd } = el;
                const before = input.slice(0, selectionStart ?? 0);
                const after = input.slice(selectionEnd ?? input.length);
                const next = `${before}\n${after}`;
                setInput(next);
                requestAnimationFrame(() => {
                  const pos = (selectionStart ?? next.length) + 1;
                  el.selectionStart = el.selectionEnd = pos;
                  autosize();
                });
              } else {
                e.preventDefault();
                send();
              }
            }
          }}
        />
        <button
          type="submit"
          disabled={!uid || !canSend}
          style={{
            padding: "5px 14px",
            borderRadius: 10,
            background: "#111827",
            color: "#fff",
            border: "none",
            opacity: !uid || !canSend ? 0.5 : 1,
            cursor: !uid || !canSend ? "not-allowed" : "pointer",
            height: "30px",
            whiteSpace: "nowrap",
          }}
        >
          送信
        </button>
      </form>
    </div>
  );
}
