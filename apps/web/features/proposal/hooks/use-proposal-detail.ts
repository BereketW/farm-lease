"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProposal } from "@/features/proposal/datasource/proposals";
import { getSocket, useSocketVersion } from "@/lib/socket";
import type { NegotiationMessage, ProposalDetail, ProposalViewer } from "@/lib/api/types";

type ProposalQueryData = { proposal: ProposalDetail; viewer: ProposalViewer };

export function proposalDetailKey(id: string) {
  return ["proposal", id] as const;
}

/**
 * Surgically append/replace a single negotiation message inside the cached
 * proposal payload. Idempotent — duplicate ids are a no-op. If a matching
 * optimistic temp message exists (same sender + body, id starting with
 * `tmp-`), we swap it in place instead of appending so the user doesn't
 * see two bubbles.
 */
export function mergeNegotiationMessage(
  data: ProposalQueryData | undefined,
  incoming: NegotiationMessage
): ProposalQueryData | undefined {
  if (!data) return data;
  const list = data.proposal.messages;
  if (list.some((m) => m.id === incoming.id)) return data;

  const tmpIdx = list.findIndex(
    (m) =>
      m.id.startsWith("tmp-") &&
      m.senderId === incoming.senderId &&
      m.message === incoming.message
  );
  let next: NegotiationMessage[];
  if (tmpIdx !== -1) {
    next = list.slice();
    next[tmpIdx] = incoming;
  } else {
    next = [...list, incoming];
  }
  return { ...data, proposal: { ...data.proposal, messages: next } };
}

export function useProposalDetail(id: string) {
  const queryClient = useQueryClient();
  const socketVersion = useSocketVersion();
  const query = useQuery({
    queryKey: proposalDetailKey(id),
    queryFn: () => getProposal(id),
  });

  useEffect(() => {
    const socket = getSocket();

    const onMessage = (incoming: NegotiationMessage) => {
      queryClient.setQueryData<ProposalQueryData>(proposalDetailKey(id), (prev) =>
        mergeNegotiationMessage(prev, incoming)
      );
    };

    const onRead = (payload: { ids: string[]; readerId: string }) => {
      if (!payload?.ids?.length) return;
      queryClient.setQueryData<ProposalQueryData>(proposalDetailKey(id), (prev) => {
        if (!prev) return prev;
        const idSet = new Set(payload.ids);
        const messages = prev.proposal.messages.map((m) =>
          idSet.has(m.id) ? { ...m, isRead: true } : m
        );
        return { ...prev, proposal: { ...prev.proposal, messages } };
      });
    };

    const onRevised = () => {
      void queryClient.invalidateQueries({ queryKey: proposalDetailKey(id) });
    };

    socket.emit("proposal:join", id);
    socket.on("negotiation:message", onMessage);
    socket.on("negotiation:read", onRead);
    socket.on("proposal:revised", onRevised);

    return () => {
      socket.emit("proposal:leave", id);
      socket.off("negotiation:message", onMessage);
      socket.off("negotiation:read", onRead);
      socket.off("proposal:revised", onRevised);
    };
  }, [id, queryClient, socketVersion]);

  /** Prepend an older page of messages (pagination — keeps sort order). */
  function prependMessages(older: NegotiationMessage[]) {
    queryClient.setQueryData<ProposalQueryData>(proposalDetailKey(id), (prev) => {
      if (!prev) return prev;
      const existingIds = new Set(prev.proposal.messages.map((m) => m.id));
      const fresh = older.filter((m) => !existingIds.has(m.id));
      return {
        ...prev,
        proposal: { ...prev.proposal, messages: [...fresh, ...prev.proposal.messages] },
      };
    });
  }

  return { ...query, prependMessages };
}
