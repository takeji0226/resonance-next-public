/**
 * Relay: POST /api/relay/onboarding/reply
 * 目的: ユーザの回答を Rails に送り、AI返答を得る。
 */
import { relayToRails } from "../../_utils/relay";

export async function POST(req: Request) {
  const body = await req.text(); // { message, history, ... } をそのまま転送
  return relayToRails("POST", "/api/onboarding/reply", { body });
}
