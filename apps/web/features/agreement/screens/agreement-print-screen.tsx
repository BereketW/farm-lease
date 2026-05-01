"use client";

import { use, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAgreement } from "@/features/agreement/datasource/agreements";

/**
 * Print-optimized agreement view. The user triggers the browser's
 * native "Save as PDF" / "Print" from here. Sidebar + topbar are already
 * skipped because of the `@media print` CSS plus auto-open of print dialog.
 */
export function AgreementPrintScreen({
  idPromise,
}: {
  idPromise: Promise<string>;
}) {
  const id = use(idPromise);
  const query = useQuery({
    queryKey: ["agreement", id],
    queryFn: () => getAgreement(id),
  });

  useEffect(() => {
    if (query.data) {
      const timer = setTimeout(() => window.print(), 400);
      return () => clearTimeout(timer);
    }
  }, [query.data]);

  if (query.isLoading) {
    return <p className="p-10 text-center text-sm text-zinc-500">Loading agreement…</p>;
  }
  if (query.error || !query.data) {
    return (
      <p className="p-10 text-center text-sm text-rose-700">
        {(query.error as Error)?.message ?? "Agreement not found"}
      </p>
    );
  }

  const { agreement } = query.data;
  const terms = agreement.terms;
  const parties = terms.parties;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="mx-auto my-8 max-w-[820px] bg-white p-12 font-serif text-zinc-900 shadow-xl print:my-0 print:shadow-none">
        <header className="mb-8 border-b-2 border-emerald-800 pb-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-700">
            FarmLease · Lease Agreement
          </p>
          <h1 className="mt-2 text-3xl font-bold">LAND LEASE AGREEMENT</h1>
          <p className="mt-1 text-sm text-zinc-600">Agreement ID: {agreement.id}</p>
        </header>

        <section className="mb-6 text-sm leading-relaxed">
          <p>
            This agreement is entered into on{" "}
            <strong>{new Date(agreement.createdAt).toLocaleDateString()}</strong> between the
            parties identified below, for the lease of land forming part of the farmer
            cluster described herein, on the terms set out below.
          </p>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-6 rounded-lg border border-zinc-200 p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Investor
            </p>
            <p className="mt-1 font-semibold">{parties?.investor?.name ?? "—"}</p>
            <p className="text-xs text-zinc-600">{parties?.investor?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Farmer Cluster
            </p>
            <p className="mt-1 font-semibold">{parties?.cluster?.name ?? "—"}</p>
            <p className="text-xs text-zinc-600">
              {parties?.cluster?.location ?? ""}
              {parties?.cluster?.region ? ` · ${parties.cluster.region}` : ""}
            </p>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-3 gap-4 rounded-lg bg-emerald-50 p-5 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
              Lease Term
            </p>
            <p className="mt-1 font-semibold">
              {new Date(agreement.startDate).toLocaleDateString()} →{" "}
              {new Date(agreement.endDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-zinc-600">
              {terms.lease?.durationMonths ?? 0} months
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
              Lease Payment
            </p>
            <p className="mt-1 font-semibold">
              {terms.financial?.currency ?? "ETB"}{" "}
              {Number(terms.financial?.budget ?? 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
              Crop Intended
            </p>
            <p className="mt-1 font-semibold">{terms.lease?.cropIntended ?? "—"}</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-zinc-300 pb-1 text-sm font-bold uppercase tracking-wider">
            Terms and Clauses
          </h2>
          <ol className="space-y-3 text-sm leading-relaxed">
            {agreement.clauses.map((c) => (
              <li key={c.title}>
                <strong>{c.title}</strong>
                <p className="ml-2 mt-0.5 text-zinc-800">{c.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 grid grid-cols-2 gap-10">
          <SignatureBlock
            role="Investor"
            name={parties?.investor?.name ?? "—"}
            signature={agreement.signatures.find((s) => s.role === "INVESTOR")}
          />
          <SignatureBlock
            role="Cluster Representative"
            name={agreement.signatures.find((s) => s.role === "REPRESENTATIVE")?.signer?.name ?? "—"}
            signature={agreement.signatures.find((s) => s.role === "REPRESENTATIVE")}
          />
        </section>

        <footer className="mt-12 border-t border-zinc-200 pt-4 text-center text-[10px] text-zinc-500">
          Generated via the FarmLease platform on{" "}
          {new Date().toLocaleString()} · Agreement status:{" "}
          <strong>{agreement.status.replace("_", " ")}</strong>
        </footer>

        <div className="no-print mt-6 flex justify-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

function SignatureBlock({
  role,
  name,
  signature,
}: {
  role: string;
  name: string;
  signature?: { signedAt: string };
}) {
  return (
    <div className="border-t-2 border-zinc-900 pt-2 text-sm">
      <p className="font-semibold">{name}</p>
      <p className="text-xs text-zinc-600">{role}</p>
      {signature ? (
        <p className="mt-1 text-[10px] text-emerald-800">
          ✓ Digitally signed · {new Date(signature.signedAt).toLocaleString()}
        </p>
      ) : (
        <p className="mt-1 text-[10px] italic text-zinc-400">Awaiting signature…</p>
      )}
    </div>
  );
}
