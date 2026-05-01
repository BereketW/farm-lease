"use client";

import { Check, CheckCheck, Clock, Paperclip } from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import { NameAvatar } from "../_design/avatar";
import type { NegotiationMessage } from "@/lib/api/types";

type Props = {
  message: NegotiationMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  pending?: boolean;
};

export function NegotiationMessageBubble({
  message,
  isOwn,
  showAvatar,
  showName,
  pending,
}: Props) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex items-end gap-2", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn ? (
        <div className="w-7 shrink-0">
          {showAvatar ? (
            <NameAvatar size="sm" id={message.senderId} name={message.sender.name} />
          ) : null}
        </div>
      ) : null}

      <div className={cn("flex max-w-[78%] flex-col gap-0.5", isOwn ? "items-end" : "items-start")}>
        {showName && !isOwn ? (
          <span className="px-1 text-[11px] font-medium text-emerald-900/70 dark:text-emerald-200/70">
            {message.sender.name ?? "User"}
          </span>
        ) : null}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm transition-opacity",
            isOwn
              ? "rounded-br-md bg-emerald-600 text-white"
              : "rounded-bl-md border border-emerald-100 bg-white text-zinc-900 dark:border-emerald-900/40 dark:bg-zinc-900 dark:text-zinc-100",
            pending && "opacity-70"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
          {message.attachments.length > 0 ? (
            <div className="mt-1.5 flex flex-col gap-1">
              {message.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1 rounded text-[11px] underline underline-offset-2",
                    isOwn ? "text-emerald-100" : "text-emerald-700 dark:text-emerald-300"
                  )}
                >
                  <Paperclip className="h-2.5 w-2.5 shrink-0" />
                  Attachment {i + 1}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-1 text-[10px] tabular-nums",
            isOwn ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
          )}
        >
          {time}
          {isOwn ? (
            pending ? (
              <Clock className="h-2.5 w-2.5" aria-label="Sending" />
            ) : message.isRead ? (
              <CheckCheck className="h-2.5 w-2.5 text-sky-400" aria-label="Read" />
            ) : (
              <Check className="h-2.5 w-2.5" aria-label="Delivered" />
            )
          ) : null}
        </span>
      </div>
    </div>
  );
}
