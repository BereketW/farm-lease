import type { ClusterSummary } from "@/lib/api/types";

export const MOCK_CLUSTERS: ClusterSummary[] = [
  {
    id: "mock-cluster-1",
    name: "Bahir Dar Teff Collective",
    region: "Amhara",
    description: "120 ha mixed teff and barley cluster near Bahir Dar.",
    representatives: [
      {
        userId: "mock-rep-1",
        isPrimary: true,
        user: { id: "mock-rep-1", name: "Mock Representative", email: "mock.rep@farmlease.local" },
      },
    ],
    _count: { farmers: 24, proposals: 3 },
  },
  {
    id: "mock-cluster-2",
    name: "Adama Maize Cooperative",
    region: "Oromia",
    description: "Smallholder maize cooperative with shared irrigation.",
    representatives: [
      {
        userId: "mock-rep-2",
        isPrimary: true,
        user: { id: "mock-rep-2", name: "Mock Rep 2", email: "rep2@farmlease.local" },
      },
    ],
    _count: { farmers: 41, proposals: 1 },
  },
  {
    id: "mock-cluster-3",
    name: "Hawassa Coffee Group",
    region: "Sidama",
    description: "Specialty coffee farmers seeking long-term offtake.",
    representatives: [],
    _count: { farmers: 15, proposals: 0 },
  },
];
