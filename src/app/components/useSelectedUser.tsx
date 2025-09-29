// シンプルな選択ユーザーの状態フック
// - 理由: ヘッダーやフォームから共通で参照できる単一の選択状態が必要
// - 注意: 既に Zustand/Context があるなら、そちらに統合してOK
import { useEffect, useState } from "react";

export type UserLite = { id: number; name?: string; email?: string };

export function useSelectedUser() {
  const [selected, setSelected] = useState<UserLite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;

    async function bootstrap() {
      try {
        // すでに選択済みなら触らない
        if (selected) return;

        // 未選択なら “現在ログイン中ユーザー” を取得して初期セット
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) throw new Error(`failed to fetch me: ${res.status}`);
        const me = (await res.json()) as UserLite;
        if (!abort) setSelected(me);
      } catch (e) {
        console.error(e);
      } finally {
        if (!abort) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      abort = true;
    };
  }, [selected]);

  return { selected, setSelected, loading };
}
