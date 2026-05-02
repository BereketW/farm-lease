/**
 * FarmLease seed
 * -----------------------------------------------------------------
 * Creates a full, dev-ready dataset:
 *   • 1 admin, 1 investor, 3 representatives, 10 farmers
 *   • 3 verified/pending clusters across Amhara, Oromia & Sidama,
 *     each with geodata (GeoJSON polygon), coordinates, documents,
 *     crop types, farmer members and assigned representatives.
 *   • Role-specific profiles (investor / farmer / representative).
 *   • Better-Auth credential accounts with bcrypt-hashed passwords.
 *
 * User IDs match apps/web/lib/dev-user.ts DEV_USER_OPTIONS so the
 * dev role switcher works out of the box.
 */

import {
  ClusterStatus,
  PrismaClient,
  Role,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* ──────────────────────────────────────────────────────────────── */
/*  Types                                                            */
/* ──────────────────────────────────────────────────────────────── */

type SeedUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  password: string;
};

type SeedFarmer = SeedUser & {
  region: string;
  landShares: number;
};

type SeedRep = SeedUser & {
  bio: string;
};

type SeedInvestor = SeedUser & {
  companyName: string;
  budget: number;
  bio: string;
  preferredRegions: string[];
  preferredCrops: string[];
};

/* ──────────────────────────────────────────────────────────────── */
/*  Users                                                            */
/* ──────────────────────────────────────────────────────────────── */

const ADMIN: SeedUser = {
  id: "mock-admin-1",
  email: "admin1@farmlease.com",
  name: "FarmLease Admin",
  role: Role.ADMIN,
  phone: "+251911000001",
  password: "admin123",
};

const INVESTOR: SeedInvestor = {
  id: "mock-investor-1",
  email: "investor@farmlease.com",
  name: "Dawit Bekele",
  role: Role.INVESTOR,
  phone: "+251911100200",
  password: "investor123",
  companyName: "Horn Agri Capital",
  budget: 5_000_000,
  bio: "Long-horizon agri-investor focused on smallholder cluster partnerships in highland Ethiopia.",
  preferredRegions: ["Amhara", "Oromia", "Sidama"],
  preferredCrops: ["Teff", "Coffee", "Maize"],
};

const REPRESENTATIVES: SeedRep[] = [
  {
    id: "mock-rep-1",
    email: "rep.bahirdar@farmlease.com",
    name: "Alemayehu Tadesse",
    role: Role.REPRESENTATIVE,
    phone: "+251911220301",
    password: "rep123",
    bio: "Cooperative coordinator for the Bahir Dar teff belt; fifteen years facilitating land-lease agreements on behalf of smallholder farmers.",
  },
  {
    id: "mock-rep-2",
    email: "rep.adama@farmlease.com",
    name: "Fatuma Hassan",
    role: Role.REPRESENTATIVE,
    phone: "+251911220302",
    password: "rep123",
    bio: "Primary representative of the Adama Maize Cooperative, advocating for transparent pricing and modern storage infrastructure.",
  },
  {
    id: "mock-rep-3",
    email: "rep.hawassa@farmlease.com",
    name: "Getachew Mengistu",
    role: Role.REPRESENTATIVE,
    phone: "+251911220303",
    password: "rep123",
    bio: "Coffee-cooperative spokesperson for the Sidama highlands; certified organic-grower liaison.",
  },
];

const FARMERS: SeedFarmer[] = [
  // Amhara / Bahir Dar (4)
  {
    id: "mock-farmer-1",
    email: "farmer@farmlease.com",
    name: "Yohannes Abebe",
    role: Role.FARMER,
    phone: "+251911330401",
    password: "farmer123",
    region: "Amhara",
    landShares: 6.2,
  },
  {
    id: "farmer-amh-1",
    email: "mulu.bekele@farmlease.com",
    name: "Mulu Bekele",
    role: Role.FARMER,
    phone: "+251911330402",
    password: "farmer123",
    region: "Amhara",
    landShares: 4.8,
  },
  {
    id: "farmer-amh-2",
    email: "solomon.wolde@farmlease.com",
    name: "Solomon Wolde",
    role: Role.FARMER,
    phone: "+251911330403",
    password: "farmer123",
    region: "Amhara",
    landShares: 3.5,
  },
  {
    id: "farmer-amh-3",
    email: "hirut.getahun@farmlease.com",
    name: "Hirut Getahun",
    role: Role.FARMER,
    phone: "+251911330404",
    password: "farmer123",
    region: "Amhara",
    landShares: 5.1,
  },
  // Oromia / Adama (3)
  {
    id: "farmer-oro-1",
    email: "birtukan.negasi@farmlease.com",
    name: "Birtukan Negasi",
    role: Role.FARMER,
    phone: "+251911330501",
    password: "farmer123",
    region: "Oromia",
    landShares: 8.4,
  },
  {
    id: "farmer-oro-2",
    email: "tariku.desta@farmlease.com",
    name: "Tariku Desta",
    role: Role.FARMER,
    phone: "+251911330502",
    password: "farmer123",
    region: "Oromia",
    landShares: 6.0,
  },
  {
    id: "farmer-oro-3",
    email: "almaz.tesfaye@farmlease.com",
    name: "Almaz Tesfaye",
    role: Role.FARMER,
    phone: "+251911330503",
    password: "farmer123",
    region: "Oromia",
    landShares: 7.2,
  },
  // Sidama / Hawassa (3)
  {
    id: "farmer-sid-1",
    email: "kebede.haile@farmlease.com",
    name: "Kebede Haile",
    role: Role.FARMER,
    phone: "+251911330601",
    password: "farmer123",
    region: "Sidama",
    landShares: 2.3,
  },
  {
    id: "farmer-sid-2",
    email: "meron.asfaw@farmlease.com",
    name: "Meron Asfaw",
    role: Role.FARMER,
    phone: "+251911330602",
    password: "farmer123",
    region: "Sidama",
    landShares: 1.8,
  },
  {
    id: "farmer-sid-3",
    email: "desalegn.girma@farmlease.com",
    name: "Desalegn Girma",
    role: Role.FARMER,
    phone: "+251911330603",
    password: "farmer123",
    region: "Sidama",
    landShares: 3.0,
  },
];

/* ──────────────────────────────────────────────────────────────── */
/*  Clusters                                                         */
/*                                                                  */
/*  `geodata` is a GeoJSON Polygon (WGS-84) drawn roughly around    */
/*  the cluster's centroid. `coordinates` is the centroid itself    */
/*  — handy for map pins / default zoom.                            */
/* ──────────────────────────────────────────────────────────────── */

function polygon(lat: number, lng: number, delta = 0.02) {
  const ring = [
    [lng - delta, lat + delta],
    [lng + delta, lat + delta],
    [lng + delta, lat - delta],
    [lng - delta, lat - delta],
    [lng - delta, lat + delta],
  ];
  return { type: "Polygon", coordinates: [ring] };
}

type SeedCluster = {
  id: string;
  name: string;
  description: string;
  location: string;
  region: string;
  coordinates: { lat: number; lng: number };
  totalArea: number;
  cropTypes: string[];
  status: ClusterStatus;
  documents: string[];
  primaryRepId: string;
  secondaryRepIds?: string[];
  farmerIds: string[];
};

const CLUSTERS: SeedCluster[] = [
  {
    id: "cluster-bahirdar-teff",
    name: "Bahir Dar Teff Collective",
    description:
      "A collective of smallholder farmers along the Blue Nile basin near Lake Tana, cultivating heirloom teff varieties on fertile volcanic soils. Irrigated via shallow wells and seasonal streams.",
    location: "Gonder Road, Bahir Dar, Amhara",
    region: "Amhara",
    coordinates: { lat: 11.594, lng: 37.39 },
    totalArea: 485.5,
    cropTypes: ["Teff", "Maize", "Chickpeas"],
    status: ClusterStatus.VERIFIED,
    documents: [
      "https://files.farmlease.dev/bahirdar/land-title-deed.pdf",
      "https://files.farmlease.dev/bahirdar/survey-2024.pdf",
      "https://files.farmlease.dev/bahirdar/cooperative-charter.pdf",
    ],
    primaryRepId: "mock-rep-1",
    farmerIds: ["mock-farmer-1", "farmer-amh-1", "farmer-amh-2", "farmer-amh-3"],
  },
  {
    id: "cluster-adama-maize",
    name: "Adama Maize Cooperative",
    description:
      "Rift-Valley lowland cluster producing high-yield maize alongside rotation wheat and sorghum. Served by the Adama–Awash feeder road and three community grain stores.",
    location: "Wonji district, Adama, Oromia",
    region: "Oromia",
    coordinates: { lat: 8.541, lng: 39.27 },
    totalArea: 720.0,
    cropTypes: ["Maize", "Wheat", "Sorghum"],
    status: ClusterStatus.VERIFIED,
    documents: [
      "https://files.farmlease.dev/adama/land-title-deed.pdf",
      "https://files.farmlease.dev/adama/coop-bylaws.pdf",
      "https://files.farmlease.dev/adama/irrigation-permit.pdf",
    ],
    primaryRepId: "mock-rep-2",
    farmerIds: ["farmer-oro-1", "farmer-oro-2", "farmer-oro-3"],
  },
  {
    id: "cluster-hawassa-coffee",
    name: "Hawassa Coffee Group",
    description:
      "Certified organic Sidama coffee producers cultivating shade-grown Arabica alongside enset. Awaiting final boundary verification from the regional cadastral office.",
    location: "Tula kebele, Hawassa, Sidama",
    region: "Sidama",
    coordinates: { lat: 7.062, lng: 38.476 },
    totalArea: 180.25,
    cropTypes: ["Coffee", "Enset"],
    status: ClusterStatus.PENDING,
    documents: [
      "https://files.farmlease.dev/hawassa/organic-cert-2024.pdf",
      "https://files.farmlease.dev/hawassa/pending-survey.pdf",
    ],
    primaryRepId: "mock-rep-3",
    farmerIds: ["farmer-sid-1", "farmer-sid-2", "farmer-sid-3"],
  },
];

/* ──────────────────────────────────────────────────────────────── */
/*  Helpers                                                          */
/* ──────────────────────────────────────────────────────────────── */

async function upsertUserWithPassword(u: SeedUser) {
  const user = await prisma.user.upsert({
    where: { id: u.id },
    update: {
      email: u.email,
      name: u.name,
      role: u.role,
      status: UserStatus.ACTIVE,
      phone: u.phone,
    },
    create: {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phone: u.phone,
    },
  });

  const existing = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });
  if (!existing) {
    const hashed = await bcrypt.hash(u.password, 10);
    await prisma.account.create({
      data: {
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashed,
      },
    });
  }

  return user;
}

/* ──────────────────────────────────────────────────────────────── */
/*  Main                                                             */
/* ──────────────────────────────────────────────────────────────── */

async function main() {
  console.log("🌱  Seeding FarmLease …");

  /* Users + credentials */
  await upsertUserWithPassword(ADMIN);

  const investor = await upsertUserWithPassword(INVESTOR);
  await prisma.investorProfile.upsert({
    where: { userId: investor.id },
    update: {
      companyName: INVESTOR.companyName,
      budget: INVESTOR.budget,
      bio: INVESTOR.bio,
      preferredRegions: INVESTOR.preferredRegions,
      preferredCrops: INVESTOR.preferredCrops,
      verified: true,
    },
    create: {
      userId: investor.id,
      companyName: INVESTOR.companyName,
      budget: INVESTOR.budget,
      bio: INVESTOR.bio,
      preferredRegions: INVESTOR.preferredRegions,
      preferredCrops: INVESTOR.preferredCrops,
      verified: true,
    },
  });

  for (const r of REPRESENTATIVES) {
    const user = await upsertUserWithPassword(r);
    await prisma.representativeProfile.upsert({
      where: { userId: user.id },
      update: { bio: r.bio, verified: true, permissions: ["NEGOTIATE", "SIGN"] },
      create: {
        userId: user.id,
        bio: r.bio,
        verified: true,
        permissions: ["NEGOTIATE", "SIGN"],
      },
    });
  }

  for (const f of FARMERS) {
    const user = await upsertUserWithPassword(f);
    await prisma.farmerProfile.upsert({
      where: { userId: user.id },
      update: {
        region: f.region,
        landShares: f.landShares,
        idVerified: true,
      },
      create: {
        userId: user.id,
        region: f.region,
        landShares: f.landShares,
        idVerified: true,
      },
    });
  }

  console.log(
    `👤  Users: 1 admin · 1 investor · ${REPRESENTATIVES.length} reps · ${FARMERS.length} farmers`,
  );

  /* Clusters — idempotent replace of memberships */
  for (const c of CLUSTERS) {
    const geodata = polygon(c.coordinates.lat, c.coordinates.lng, 0.02);

    const cluster = await prisma.cluster.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        description: c.description,
        location: c.location,
        region: c.region,
        coordinates: c.coordinates,
        geodata,
        totalArea: c.totalArea,
        cropTypes: c.cropTypes,
        status: c.status,
        documents: c.documents,
      },
      create: {
        id: c.id,
        name: c.name,
        description: c.description,
        location: c.location,
        region: c.region,
        coordinates: c.coordinates,
        geodata,
        totalArea: c.totalArea,
        cropTypes: c.cropTypes,
        status: c.status,
        documents: c.documents,
      },
    });

    // Reset memberships so the seed is idempotent
    await prisma.clusterFarmer.deleteMany({ where: { clusterId: cluster.id } });
    await prisma.clusterRepresentative.deleteMany({
      where: { clusterId: cluster.id },
    });

    // Primary representative
    await prisma.clusterRepresentative.create({
      data: {
        clusterId: cluster.id,
        userId: c.primaryRepId,
        isPrimary: true,
      },
    });
    // Secondary reps (if any)
    for (const repId of c.secondaryRepIds ?? []) {
      await prisma.clusterRepresentative.create({
        data: { clusterId: cluster.id, userId: repId, isPrimary: false },
      });
    }

    // Farmers — distribute landShares proportional to their profile
    for (const farmerId of c.farmerIds) {
      const farmer = FARMERS.find((f) => f.id === farmerId);
      await prisma.clusterFarmer.create({
        data: {
          clusterId: cluster.id,
          userId: farmerId,
          landShare: farmer?.landShares ?? 1,
        },
      });
    }

    console.log(
      `📍  ${c.name} · ${c.region} · ${c.farmerIds.length} farmers · ${c.status}`,
    );
  }

  console.log("\n🔐  Credentials");
  console.log("   admin@farmlease.com        / admin123");
  console.log("   investor@farmlease.com     / investor123");
  console.log("   rep.bahirdar@farmlease.com / rep123   (+ adama, hawassa)");
  console.log("   farmer@farmlease.com       / farmer123");
  console.log("\n🎉  Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
