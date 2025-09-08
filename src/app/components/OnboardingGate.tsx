/**
 * OnboardingGate
 * -----------------------------------------------------------------------------
 * 役割:
 *  - Server Component から渡された初期表示フラグ(initialVisible)を受け取り、
 *    クライアント側の state で OnboardingOverlay の表示/非表示を制御する。
 * 理由:
 *  - page.tsx は Server Component で state を持てないため、クライアントで閉じる必要がある。
 * 注意:
 *  - Overlay 内の「小石を投げる」成功時に onFinish() が呼ばれる前提。
 */

"use client";

import { useState } from "react";
import OnboardingOverlay from "@components/OnboardingOverlay";

export default function OnboardingGate({
  initialVisible,
}: {
  initialVisible: boolean;
}) {
  const [visible, setVisible] = useState<boolean>(initialVisible);

  return (
    <OnboardingOverlay
      visible={visible}
      onFinish={() => setVisible(false)} // ← 押下後に閉じる
      // pushToChat は未指定でもOK（OverlayがCustomEventを投げる実装のため）
    />
  );
}
