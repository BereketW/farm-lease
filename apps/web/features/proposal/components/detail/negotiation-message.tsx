"use client";

import { Check, CheckCheck, Clock, Paperclip } from "lucide-react";
import { cn } from "@farm-lease/ui/lib/utils";
import { NameAvatar } from "@/components/editorial";
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
    <div
      className={cn(
        "flex items-end gap-2",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {!isOwn ? (
        <div className="w-7 shrink-0">
          {showAvatar ? (
            <NameAvatar
              size="sm"
              id={message.senderId}
              name={message.sender.name}
            />
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "flex max-w-[78%] flex-col gap-0.5",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {showName && !isOwn ? (
          <span
            className="px-1 font-serif text-[11px] italic text-emerald-900/70 dark:text-emerald-200/70"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {message.sender.name ?? "Anonymous"}
          </span>
        ) : null}
        <div
          className={cn(
            "relative rounded-sm px-3.5 py-2 text-[13.5px] leading-relaxed shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-opacity",
            isOwn
              ? "border border-emerald-900 bg-emerald-950 text-stone-50 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950"
              : "border border-emerald-950/10 bg-white text-stone-900 dark:border-emerald-400/15 dark:bg-stone-900 dark:text-stone-100",
            pending && "opacity-70"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
          {message.attachments.length > 0 ? (
            <div
              className={cn(
                "mt-2 flex flex-col gap-1 border-t pt-1.5",
                isOwn
                  ? "border-emerald-700/40 dark:border-emerald-700/20"
                  : "border-emerald-950/10 dark:border-emerald-400/15"
              )}
            >
              {message.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] underline underline-offset-2",
                    isOwn
                      ? "text-emerald-100 dark:text-emerald-900"
                      : "text-emerald-800 dark:text-emerald-300"
                  )}
                >
                  <Paperclip className="h-2.5 w-2.5 shrink-0" />
                  Attachment · {String(i + 1).padStart(2, "0")}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-1 font-mono text-[10px] tabular-nums",
            isOwn
              ? "text-emerald-800/70 dark:text-emerald-300/70"
              : "text-stone-500 dark:text-stone-500"
          )}
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {time}
          {isOwn ? (
            pending ? (
              <Clock className="h-2.5 w-2.5" aria-label="Sending" />
            ) : message.isRead ? (
              <CheckCheck
                className="h-2.5 w-2.5 text-sky-500"
                aria-label="Read"
              />
            ) : (
              <Check className="h-2.5 w-2.5" aria-label="Delivered" />
            )
          ) : null}
        </span>
      </div>
    </div>
  );
}
