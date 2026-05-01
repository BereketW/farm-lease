"use client";

import { FileText, UploadCloud, X } from "lucide-react";
import { StepShell } from "./step-shell";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
};

export function StepDocuments({ files, onChange }: Props) {
  return (
    <StepShell
      eyebrow="Step 4"
      title="Supporting documents"
      description="Optional — PDFs, images or Word docs. Uploaded on submit."
    >
      <label
        htmlFor="documents"
        className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 px-6 py-10 text-center transition hover:bg-emerald-50/60"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-emerald-700 ring-1 ring-emerald-200">
          <UploadCloud className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium text-emerald-950">
          Click to upload or drag files here
        </span>
        <span className="text-xs text-zinc-500">PDF, DOCX, images — up to 10MB each</span>
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
        <ul className="mt-4 space-y-2 text-sm">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="truncate">{file.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</span>
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, i) => i !== idx))}
                  className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </StepShell>
  );
}
