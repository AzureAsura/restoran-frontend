import { apiFetch } from "@/lib/api-client";
import type { ChatRequest, ChatResponse } from "@/types/api";

export function sendChatMessage(payload: ChatRequest) {
  return apiFetch<ChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
