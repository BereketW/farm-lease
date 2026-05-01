import { prisma } from "@farm-lease/db";
import { ClusterStatus, Role, UserStatus } from "@prisma/client";

const MOCK_USERS = [
  { id: "mock-investor-1", email: "investor@farmlease.local", name: "Mock Investor", role: Role.INVESTOR },
  { id: "mock-farmer-1", email: "farmer@farmlease.local", name: "Mock Farmer", role: Role.FARMER },
  { id: "mock-admin-1", email: "admin@farmlease.local", name: "Mock Admin", role: Role.ADMIN },
];

const MOCK_CLUSTERS = [
  {
    id: "mock-cluster-1",
    name: "Bahir Dar Teff Collective",
    region: "Amhara",
    location: "Bahir Dar, Amhara Region",
    description: "120 ha mixed teff and barley cluster near Bahir Dar.",
    cropTypes: ["Teff", "Barley"],
    repId: "mock-rep-1",
    repEmail: "mock.rep1@farmlease.local",
    repName: "Bahir Dar Teff Collective",
  },
  {
    id: "mock-cluster-2",
    name: "Adama Maize Cooperative",
    region: "Oromia",
    location: "Adama, Oromia Region",
    description: "Smallholder maize cooperative with shared irrigation.",
    cropTypes: ["Maize", "Sorghum"],
    repId: "mock-rep-2",
    repEmail: "mock.rep2@farmlease.local",
    repName: "Adama Maize Cooperative",
  },
  {
    id: "mock-cluster-3",
    name: "Hawassa Coffee Group",
    region: "Sidama",
    location: "Hawassa, Sidama Region",
    description: "Specialty coffee farmers seeking long-term offtake.",
    cropTypes: ["Coffee", "Enset"],
    repId: "mock-rep-3",
    repEmail: "mock.rep3@farmlease.local",
    repName: "Hawassa Coffee Group",
  },
];

async function upsertUser(data: {
  id: string;
  email: string;
  name: string;
  role: Role;
}) {
  return prisma.user.upsert({
    where: { id: data.id },
    update: { email: data.email, name: data.name, role: data.role, status: UserStatus.ACTIVE },
    create: {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      emailVerified: true,
      status: UserStatus.ACTIVE,
    },
  });
}

export async function ensureDevMockClusters() {
  if (process.env.NODE_ENV === "production") return;

  // 1. Base mock users (investor, farmer, admin)
  for (const u of MOCK_USERS) {
    await upsertUser(u);
  }

  // 2. Per-cluster: representative user + cluster + ClusterRepresentative link
  for (const c of MOCK_CLUSTERS) {
    await upsertUser({ id: c.repId, email: c.repEmail, name: c.repName, role: Role.REPRESENTATIVE });

    await prisma.cluster.upsert({
      where: { id: c.id },
      update: { name: c.name, region: c.region, description: c.description, cropTypes: c.cropTypes },
      create: {
        id: c.id,
        name: c.name,
        region: c.region,
        location: c.location,
        description: c.description,
        cropTypes: c.cropTypes,
        status: ClusterStatus.VERIFIED,
        geodata: {},
        coordinates: { lat: 0, lng: 0 },
        documents: [],
      },
    });

    await prisma.clusterRepresentative.upsert({
      where: { clusterId_userId: { clusterId: c.id, userId: c.repId } },
      update: { isPrimary: true },
      create: { clusterId: c.id, userId: c.repId, isPrimary: true },
    });
  }

  console.log(`[dev-seed] ensured ${MOCK_CLUSTERS.length} mock clusters`);
  console.log(`[dev-seed] mock user ids:`);
  for (const u of [...MOCK_USERS, ...MOCK_CLUSTERS.map(c => ({ id: c.repId, role: Role.REPRESENTATIVE, email: c.repEmail }))]) {
    console.log(`  ${String(u.role).padEnd(15)} ${u.id}  (${u.email})`);
  }
}
