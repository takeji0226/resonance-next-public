// app/components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (_) {
      // サーバが落ちててもクッキーはサーバ側で消せるので無視
    }
    // 画面遷移で状態リセット
    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      style={{
        padding: "6px 12px",
        border: "1px solid #ddd",
        borderRadius: 6,
        background: "#f5f5f5",
        cursor: "pointer",
        opacity: pending ? 0.6 : 1,
      }}
      aria-busy={pending}
    >
      {pending ? "Logging out..." : "Log out"}
    </button>
  );
}
