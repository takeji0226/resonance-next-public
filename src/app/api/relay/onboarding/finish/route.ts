/**
 * Relay: POST /api/relay/onboarding/finish
 * 目的: サイクルを終了し、まとめ（信念/好き/得意）を取得。
 */
import { relayToRails } from "../../_utils/relay";

export async function POST() {
  return relayToRails("POST", "/api/onboarding/finish");
}
