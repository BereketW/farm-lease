import { ClusterDetailScreen } from "@/features/cluster/screens/cluster-detail-screen";

export default function ClusterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ClusterDetailScreen idPromise={params} />;
}
