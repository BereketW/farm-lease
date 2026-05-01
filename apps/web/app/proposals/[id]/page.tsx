import { ProposalDetailScreen } from "@/features/proposal/screens/proposal-detail-screen";

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ProposalDetailScreen idPromise={params.then((p) => p.id)} />;
}
