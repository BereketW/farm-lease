import { NewProposalScreen } from "@/features/proposal/screens/new-proposal-screen";

export default function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ clusterId?: string }>;
}) {
  return <NewProposalScreen searchParamsPromise={searchParams} />;
}
