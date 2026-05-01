import { AgreementDetailScreen } from "@/features/agreement/screens/agreement-detail-screen";

export default function AgreementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <AgreementDetailScreen idPromise={params.then((p) => p.id)} />;
}
