import { AgreementPrintScreen } from "@/features/agreement/screens/agreement-print-screen";

export default function AgreementPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <AgreementPrintScreen idPromise={params.then((p) => p.id)} />;
}
