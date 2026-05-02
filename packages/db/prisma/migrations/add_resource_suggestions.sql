-- Post-agreement resource suggestions
-- Provides recommendations for insurance, labor unions, worker groups, etc.

CREATE TABLE "ResourceSuggestion" (
  "id" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "category" TEXT NOT NULL, -- 'INSURANCE', 'LABOR_UNION', 'WORKER_GROUP', 'EQUIPMENT', 'ADVISORY'
  "title" TEXT NOT NULL,
  "description" TEXT,
  "providerName" TEXT,
  "contactInfo" JSONB, -- {phone, email, address, website}
  "region" TEXT, -- Match to cluster region
  "cropTypes" TEXT[], -- Relevant crop types
  "estimatedCost" TEXT,
  "notes" TEXT,
  "isRecommended" BOOLEAN NOT NULL DEFAULT false, -- Curated by admin
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ResourceSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResourceSuggestion_agreementId_idx" ON "ResourceSuggestion"("agreementId");
CREATE INDEX "ResourceSuggestion_category_idx" ON "ResourceSuggestion"("category");
CREATE INDEX "ResourceSuggestion_region_idx" ON "ResourceSuggestion"("region");

ALTER TABLE "ResourceSuggestion" ADD CONSTRAINT "ResourceSuggestion_agreementId_fkey" 
  FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
