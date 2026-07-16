"use client";

import { useQuery } from "@tanstack/react-query";
import { sessionQueryOptions } from "@/lib/queries/session";

export function useSession() {
  return useQuery(sessionQueryOptions());
}
