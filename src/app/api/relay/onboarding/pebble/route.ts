/**
 * Relay: POST /api/relay/onboarding/pebble
 * 目的: 初期問いを Rails から取得（Bearer 付与）。
 */
import { relayToRails } from "../../_utils/relay";

export async function POST() {
  return relayToRails("POST", "/api/onboarding/pebble");
}
