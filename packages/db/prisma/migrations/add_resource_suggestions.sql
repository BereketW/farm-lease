-- Post-agreement resource suggestions catalog
-- Matched by agreement region/crop profile at query time.

CREATE TYPE "ResourceCategory" AS ENUM (
  'INSURANCE',
  'LABOR_UNION',
  'WORKER_GROUP',
  'EQUIPMENT',
  'ADVISORY'
);

CREATE TABLE "resource_suggestions" (
  "id" TEXT NOT NULL,
  "category" "ResourceCategory" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "providerName" TEXT,
  "contactInfo" JSONB,
  "region" TEXT,
  "cropTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "estimatedCost" TEXT,
  "notes" TEXT,
  "isRecommended" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "resource_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "resource_suggestions_category_idx" ON "resource_suggestions"("category");
CREATE INDEX "resource_suggestions_region_idx" ON "resource_suggestions"("region");
