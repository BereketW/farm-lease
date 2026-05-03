"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ChevronUp, Lock, Paperclip, Send, WifiOff, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@farm-lease/ui/lib/utils";
import { Textarea } from "@farm-lease/ui/components/textarea";
import {
  listMessages,
  markMessagesRead,
  postMessage,
  uploadDocuments,
} from "@/features/proposal/datasource/proposals";
import type { NegotiationMessage, ProposalDetail } from "@/lib/api/types";
import { getSocket, useSocketVersion } from "@/lib/socket";
import { NegotiationMessageBubble } from "./negotiation-message";
import { proposalDetailKey } from "../../hooks/use-proposal-detail";

type Props = {
  proposalId: string;
  currentUserId: string;
  currentUserName?: string | null;
  messages: NegotiationMessage[];
  isClosed?: boolean;
  canParticipate?: boolean;
  firstMessageId?: string;
  onLoadEarlier?: (older: NegotiationMessage[]) => void;
};

type ProposalQueryData = { proposal: ProposalDetail };

const GROUP_GAP_MS = 60_000;
const NEAR_BOTTOM_PX = 80;

function dayLabel(d: Date) {
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const isYest = d.toDateString() === yest.toDateString();
  if (isToday) return "Today";
  if (isYest) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function NegotiationChat({
  proposalId,
  currentUserId,
  currentUserName,
  messages,
  isClosed,
  canParticipate,
  firstMessageId,
  onLoadEarlier,
}: Props) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hasMore, setHasMore] = useState(() => messages.length >= 100);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string | null }[]>([]);
  const [connected, setConnected] = useState(true);
  const socketVersion = useSocketVersion();

  const viewportRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const typingEmitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markedIds = useRef<Set<string>>(new Set());
  // Track whether the user is pinned to the bottom; if they've scrolled up
  // we don't yank them down on incoming messages.
  const isPinnedRef = useRef(true);
  const lastSeenIdRef = useRef<string | null>(null);

  const disabled = isClosed || !canParticipate;
  const placeholder = isClosed
    ? "Negotiation closed"
    : !canParticipate
      ? "Read-only — only the investor and representative can reply"
      : "Write a message…";

  // ---------- send mutation with optimistic update ----------

  const send = useMutation({
    mutationFn: async ({ text, files }: { text: string; files: File[] }) => {
      let attachments: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        try {
          const result = await uploadDocuments(files);
          attachments = result.urls;
        } finally {
          setUploading(false);
        }
      }
      return postMessage(proposalId, text, { attachments });
    },
    onMutate: async ({ text }) => {
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimistic: NegotiationMessage = {
        id: tempId,
        proposalId,
        senderId: currentUserId,
        message: text,
        attachments: [],
        counterTerms: null,
        isRead: false,
        createdAt: new Date().toISOString(),
        sender: { id: currentUserId, name: null },
      };
      // Force pin so we always scroll to our own message.
      isPinnedRef.current = true;
      queryClient.setQueryData<ProposalQueryData>(
        proposalDetailKey(proposalId),
        (prev) =>
          prev
            ? {
                ...prev,
                proposal: {
                  ...prev.proposal,
                  messages: [...prev.proposal.messages, optimistic],
                },
              }
            : prev
      );
      return { tempId };
    },
    onSuccess: ({ message }, _vars, ctx) => {
      queryClient.setQueryData<ProposalQueryData>(
        proposalDetailKey(proposalId),
        (prev) => {
          if (!prev) return prev;
          const list = prev.proposal.messages;
          const exists = list.some((m) => m.id === message.id);
          const tempIdx = ctx ? list.findIndex((m) => m.id === ctx.tempId) : -1;
          let next = list;
          if (tempIdx !== -1) {
            next = list.slice();
            if (exists) next.splice(tempIdx, 1);
            else next[tempIdx] = message;
          } else if (!exists) {
            next = [...list, message];
          }
          return { ...prev, proposal: { ...prev.proposal, messages: next } };
        }
      );
    },
    onError: (err, vars, ctx) => {
      queryClient.setQueryData<ProposalQueryData>(
        proposalDetailKey(proposalId),
        (prev) =>
          prev
            ? {
                ...prev,
                proposal: {
                  ...prev.proposal,
                  messages: prev.proposal.messages.filter((m) => m.id !== ctx?.tempId),
                },
              }
            : prev
      );
      setBody((b) => (b.length > 0 ? b : vars.text));
      toast.error(err instanceof Error ? err.message : "Couldn't send message");
    },
  });

  // ---------- connection status ----------

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setConnected(socket.connected);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socketVersion]);

  // ---------- typing indicator ----------

  useEffect(() => {
    const socket = getSocket();
    const onTyping = (payload: {
      proposalId: string;
      userId: string;
      name: string | null;
      isTyping: boolean;
    }) => {
      if (payload.proposalId !== proposalId) return;
      if (payload.userId === currentUserId) return;
      const prev = typingTimers.current;
      if (payload.isTyping) {
        clearTimeout(prev.get(payload.userId));
        prev.set(
          payload.userId,
          setTimeout(() => {
            setTypingUsers((u) => u.filter((x) => x.id !== payload.userId));
            prev.delete(payload.userId);
          }, 4000)
        );
        setTypingUsers((u) =>
          u.some((x) => x.id === payload.userId)
            ? u
            : [...u, { id: payload.userId, name: payload.name }]
        );
      } else {
        clearTimeout(prev.get(payload.userId));
        prev.delete(payload.userId);
        setTypingUsers((u) => u.filter((x) => x.id !== payload.userId));
      }
    };
    socket.on("proposal:typing", onTyping);
    return () => {
      socket.off("proposal:typing", onTyping);
      typingTimers.current.forEach(clearTimeout);
    };
  }, [proposalId, currentUserId, socketVersion]);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!canParticipate) return;
      getSocket().emit("proposal:typing", {
        proposalId,
        isTyping,
        name: currentUserName ?? null,
      });
    },
    [proposalId, canParticipate, currentUserName]
  );

  // ---------- read receipts ----------

  useEffect(() => {
    const toMark = messages
      .filter(
        (m) => !m.isRead && m.senderId !== currentUserId && !markedIds.current.has(m.id)
      )
      .map((m) => m.id);
    if (toMark.length === 0) return;
    toMark.forEach((id) => markedIds.current.add(id));
    markMessagesRead(proposalId, toMark).catch(() => {
      toMark.forEach((id) => markedIds.current.delete(id));
    });
  }, [messages, proposalId, currentUserId]);

  // ---------- load earlier ----------

  const handleLoadEarlier = useCallback(async () => {
    if (loadingEarlier || !onLoadEarlier) return;
    const cursor = firstMessageId;
    if (!cursor) return;
    setLoadingEarlier(true);
    try {
      const { messages: older, hasMore: more } = await listMessages(proposalId, {
        before: cursor,
        limit: 50,
      });
      onLoadEarlier(older);
      setHasMore(more);
      // Restore scroll position so prepend doesn't jump to top.
      const el = viewportRef.current;
      if (el) {
        const before = el.scrollHeight;
        requestAnimationFrame(() => {
          el.scrollTop += el.scrollHeight - before;
        });
      }
    } catch {
      toast.error("Couldn't load earlier messages");
    } finally {
      setLoadingEarlier(false);
    }
  }, [loadingEarlier, proposalId, firstMessageId, onLoadEarlier]);

  // Surface the realtime echo of our own send too — covered by hook merge.

  const handleSend = useCallback(() => {
    if (disabled || send.isPending || uploading) return;
    const text = body.trim();
    if (!text && pendingFiles.length === 0) return;
    setBody("");
    setPendingFiles([]);
    if (typingEmitTimer.current) clearTimeout(typingEmitTimer.current);
    emitTyping(false);
    // Auto-resize back to a single row immediately.
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    send.mutate({ text: text || "📎", files: pendingFiles });
  }, [body, disabled, send, uploading, pendingFiles, emitTyping]);

  // ---------- scroll behavior ----------

  const onScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    isPinnedRef.current = distance < NEAR_BOTTOM_PX;
    if (isPinnedRef.current) setUnreadCount(0);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    isPinnedRef.current = true;
    setUnreadCount(0);
  }, []);

  // Initial pin to bottom.
  useLayoutEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("auto");
      lastSeenIdRef.current = messages[messages.length - 1].id;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On new messages: if pinned, auto-scroll. Otherwise increment unread.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.id === lastSeenIdRef.current) return;
    const isOwn = last.senderId === currentUserId;
    if (isPinnedRef.current || isOwn) {
      scrollToBottom("smooth");
    } else {
      // Count only messages newer than last seen, and not from us.
      const lastSeenIndex = lastSeenIdRef.current
        ? messages.findIndex((m) => m.id === lastSeenIdRef.current)
        : -1;
      const newOnes = messages.slice(lastSeenIndex + 1).filter(
        (m) => m.senderId !== currentUserId
      );
      if (newOnes.length > 0) setUnreadCount((c) => c + newOnes.length);
    }
    lastSeenIdRef.current = last.id;
  }, [messages, currentUserId, scrollToBottom]);

  // ---------- composer auto-grow ----------

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${next}px`;
  }, [body]);

  const grouped = useMemo(() => groupByDay(messages), [messages]);

  return (
    <div className="flex h-[640px] flex-col overflow-hidden rounded-sm border border-emerald-950/15 bg-white/80 shadow-[0_1px_0_rgba(0,0,0,0.02)] dark:border-emerald-400/15 dark:bg-stone-900/60">
      {/* Connection status banner */}
      {!connected ? (
        <div className="flex items-center gap-2 border-b border-amber-700/30 bg-amber-50 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-amber-800 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-200">
          <WifiOff className="h-3 w-3 shrink-0" />
          Reconnecting… messages will sync when back online
        </div>
      ) : null}

      <header className="flex items-center justify-between border-b border-emerald-950/10 bg-emerald-50/40 px-5 py-3 dark:border-emerald-400/10 dark:bg-emerald-950/20">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
            The Correspondence
          </p>
          <p
            className="mt-0.5 font-serif text-[12px] italic text-stone-600 dark:text-stone-400"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {connected
              ? "Live · messages sync in realtime"
              : "Offline · messages will retry"}
          </p>
        </div>
        {disabled ? (
          <span className="inline-flex items-center gap-1 rounded-sm border border-stone-400/40 bg-stone-100/70 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-stone-700 dark:border-stone-500/40 dark:bg-stone-800/60 dark:text-stone-300">
            <Lock className="h-3 w-3" />
            {isClosed ? "Closed" : "Read-only"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
            </span>
            Live
          </span>
        )}
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={viewportRef}
          onScroll={onScroll}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Negotiation conversation"
          className="h-full overflow-y-auto px-4 py-3"
        >
          {/* Load earlier */}
          {onLoadEarlier && hasMore && messages.length > 0 ? (
            <div className="pb-3 flex justify-center">
              <button
                type="button"
                onClick={() => void handleLoadEarlier()}
                disabled={loadingEarlier}
                className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-950/15 bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-800 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors hover:border-emerald-700/40 hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-400/15 dark:bg-stone-900 dark:text-emerald-300"
              >
                <ChevronUp className="h-3 w-3" />
                {loadingEarlier ? "Loading…" : "Load earlier"}
              </button>
            </div>
          ) : null}

          {messages.length === 0 ? (
            <EmptyChat />
          ) : (
            <div className="flex flex-col gap-4">
              {grouped.map((day) => (
                <div key={day.label} className="flex flex-col gap-2">
                  <div className="my-1 flex items-center gap-3" aria-hidden>
                    <span className="h-px flex-1 bg-linear-to-r from-transparent via-emerald-900/20 to-emerald-900/20 dark:via-emerald-400/20 dark:to-emerald-400/20" />
                    <span className="h-1.5 w-1.5 rotate-45 bg-emerald-700 dark:bg-emerald-400" />
                    <span
                      className="font-serif text-[11px] italic text-emerald-900/80 dark:text-emerald-300/80"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      {day.label}
                    </span>
                    <span className="h-1.5 w-1.5 rotate-45 bg-emerald-700 dark:bg-emerald-400" />
                    <span className="h-px flex-1 bg-linear-to-l from-transparent via-emerald-900/20 to-emerald-900/20 dark:via-emerald-400/20 dark:to-emerald-400/20" />
                  </div>
                  {day.messages.map((m, i) => {
                    const prev = day.messages[i - 1];
                    const isOwn = m.senderId === currentUserId;
                    const sameSender = prev?.senderId === m.senderId;
                    const closeInTime =
                      !!prev &&
                      new Date(m.createdAt).getTime() -
                        new Date(prev.createdAt).getTime() <
                        GROUP_GAP_MS;
                    return (
                      <NegotiationMessageBubble
                        key={m.id}
                        message={m}
                        isOwn={isOwn}
                        showAvatar={!sameSender || !closeInTime}
                        showName={!sameSender || !closeInTime}
                        pending={m.id.startsWith("tmp-")}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-sm border border-emerald-900 bg-emerald-950 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-50 shadow-[0_3px_0_rgba(0,0,0,0.2)] transition-colors hover:bg-emerald-900 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200"
          >
            <ArrowDown className="h-3 w-3" />
            {unreadCount} new {unreadCount === 1 ? "message" : "messages"}
          </button>
        ) : null}
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 ? (
        <div className="flex items-center gap-2 border-t border-emerald-950/10 bg-stone-50/50 px-5 py-1.5 dark:border-emerald-400/10 dark:bg-stone-900/40">
          <span className="flex gap-0.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ animationDelay: `${i * 0.15}s` }}
                className="inline-block h-1 w-1 animate-bounce rounded-full bg-emerald-700 dark:bg-emerald-400"
              />
            ))}
          </span>
          <span
            className="font-serif text-[11px] italic text-stone-600 dark:text-stone-400"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {typingUsers.map((u) => u.name ?? "Someone").join(", ")}{" "}
            {typingUsers.length === 1 ? "is" : "are"} writing…
          </span>
        </div>
      ) : null}

      <form
        className={cn(
          "flex flex-col gap-2 border-t border-emerald-950/10 bg-stone-50/40 p-3 dark:border-emerald-400/10 dark:bg-stone-900/40",
          disabled && "opacity-70"
        )}
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        aria-label="Send a message"
      >
        {/* Attachment preview */}
        {pendingFiles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-sm border border-emerald-700/30 bg-emerald-50/60 px-2 py-1 text-[11px] dark:border-emerald-400/30 dark:bg-emerald-950/40"
              >
                <Paperclip className="h-3 w-3 text-emerald-700 dark:text-emerald-300" />
                <span className="max-w-[120px] truncate font-mono text-[10px] text-emerald-900 dark:text-emerald-200">
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPendingFiles((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="text-rose-600 hover:text-rose-800 dark:text-rose-400"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setPendingFiles((prev) => [...prev, ...files].slice(0, 5));
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-emerald-950/15 bg-white text-emerald-800 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors hover:border-emerald-700/40 hover:bg-emerald-50 disabled:opacity-40 dark:border-emerald-400/15 dark:bg-stone-900 dark:text-emerald-300"
            aria-label="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <Textarea
            ref={textareaRef}
            rows={1}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (!canParticipate) return;
              if (typingEmitTimer.current) clearTimeout(typingEmitTimer.current);
              emitTyping(true);
              typingEmitTimer.current = setTimeout(() => emitTyping(false), 3000);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="max-h-40 min-h-10 resize-none rounded-sm border border-emerald-950/15 bg-white px-3.5 py-2.5 font-serif text-[14px] italic leading-relaxed text-emerald-950 placeholder:italic placeholder:text-stone-400 focus-visible:border-emerald-700 focus-visible:ring-0 dark:border-emerald-400/15 dark:bg-stone-900 dark:text-emerald-50"
            style={{ fontFamily: "var(--font-fraunces)" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="submit"
            disabled={
              disabled ||
              send.isPending ||
              uploading ||
              (body.trim().length === 0 && pendingFiles.length === 0)
            }
            className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-emerald-900 bg-emerald-950 text-stone-50 shadow-[0_1px_0_rgba(0,0,0,0.3)] transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-emerald-800/25 bg-white text-emerald-800 dark:border-emerald-400/25 dark:bg-stone-950 dark:text-emerald-300">
        <Send className="h-5 w-5" />
      </div>
      <p
        className="font-serif text-xl italic text-emerald-950 dark:text-emerald-100"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        Begin the correspondence
      </p>
      <p
        className="max-w-xs font-serif text-[13px] italic text-stone-500 dark:text-stone-400"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        Messages between the investor and the cluster representative will
        appear here, preserved in order.
      </p>
    </div>
  );
}

function groupByDay(messages: NegotiationMessage[]) {
  const groups: { label: string; messages: NegotiationMessage[] }[] = [];
  for (const m of messages) {
    const label = dayLabel(new Date(m.createdAt));
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.messages.push(m);
    else groups.push({ label, messages: [m] });
  }
  return groups;
}
