/**
 * Relay: POST /api/relay/onboarding/start
 * 目的: ブラウザ → Next(BFF) → Rails へ安全に中継（Bearer 付与）。
 */
import { relayToRails } from "../../_utils/relay";

export async function POST(req: Request) {
  const body = await req.text(); // 将来パラメータが必要になっても透過できる
  return relayToRails("POST", "/api/onboarding/start", { body });
}
