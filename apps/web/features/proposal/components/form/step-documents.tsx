"use client";

import { FileText, UploadCloud, X } from "lucide-react";
import { StepShell } from "./step-shell";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StepDocuments({ files, onChange }: Props) {
  return (
    <StepShell
      eyebrow="Chapter IV"
      title="Supporting documents"
      description="Optional — PDFs, images or Word docs. They are uploaded when you submit."
    >
      <label
        htmlFor="documents"
        className="group flex cursor-pointer flex-col items-center gap-3 rounded-sm border border-dashed border-emerald-800/30 bg-stone-50/50 px-6 py-12 text-center transition-colors hover:border-emerald-800/60 hover:bg-emerald-50/40 dark:border-emerald-400/30 dark:bg-stone-900/30 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-950/30"
      >
        <span className="grid h-12 w-12 place-items-center rounded-full border border-emerald-800/30 bg-white text-emerald-800 transition-transform group-hover:-translate-y-0.5 dark:border-emerald-400/30 dark:bg-stone-950 dark:text-emerald-300">
          <UploadCloud className="h-5 w-5" />
        </span>
        <span
          className="font-serif text-lg italic text-emerald-950 dark:text-emerald-100"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Attach your supporting papers
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-500">
          Click to browse · or drop here
        </span>
        <span
          className="font-mono text-[10px] tracking-[0.14em] text-stone-500 dark:text-stone-500"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          PDF · DOCX · PNG · JPG — up to 10MB each
        </span>
        <input
          id="documents"
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const incoming = event.target.files ? Array.from(event.target.files) : [];
            onChange([...files, ...incoming]);
          }}
        />
      </label>

      {files.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-sm border border-emerald-950/15 bg-white/70 dark:border-emerald-400/15 dark:bg-stone-950/40">
          <div className="flex items-baseline justify-between border-b border-emerald-950/10 bg-stone-50/60 px-4 py-2 dark:border-emerald-400/10 dark:bg-stone-900/30">
            <span
              className="font-serif text-[12px] italic text-emerald-800 dark:text-emerald-300"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Attached
            </span>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {String(files.length).padStart(2, "0")} file
              {files.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul>
            {files.map((file, idx) => (
              <li
                key={`${file.name}-${idx}`}
                className="grid grid-cols-[28px_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-emerald-950/5 px-4 py-3 last:border-b-0 dark:border-emerald-400/5"
              >
                <span
                  className="select-none font-serif text-[12px] italic tabular-nums text-emerald-700/60 dark:text-emerald-400/60"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                  aria-hidden
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="inline-flex min-w-0 items-center gap-2">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-700/70 dark:text-emerald-400/70" />
                  <span className="truncate text-[13px] text-emerald-950 dark:text-emerald-100">
                    {file.name}
                  </span>
                </span>
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-500"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {formatSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, i) => i !== idx))}
                  className="grid h-7 w-7 place-items-center rounded-sm border border-transparent text-stone-400 transition-colors hover:border-rose-700/30 hover:bg-rose-50 hover:text-rose-700 dark:hover:border-rose-400/30 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </StepShell>
  );
}
