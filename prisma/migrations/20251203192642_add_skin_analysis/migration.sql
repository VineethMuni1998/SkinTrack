-- CreateTable
CREATE TABLE "SkinAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "detectedSkinType" "SkinType",
    "confidence" DOUBLE PRECISION,
    "wrinkles" DOUBLE PRECISION,
    "spots" DOUBLE PRECISION,
    "redness" DOUBLE PRECISION,
    "acne" DOUBLE PRECISION,
    "oiliness" DOUBLE PRECISION,
    "darkCircles" DOUBLE PRECISION,
    "texture" DOUBLE PRECISION,
    "moisture" DOUBLE PRECISION,
    "rawApiResponse" JSONB,
    "apiVersion" TEXT,
    "analysisDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedForOnboarding" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SkinAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkinAnalysis_userId_idx" ON "SkinAnalysis"("userId");

-- CreateIndex
CREATE INDEX "SkinAnalysis_analysisDate_idx" ON "SkinAnalysis"("analysisDate");

-- AddForeignKey
ALTER TABLE "SkinAnalysis" ADD CONSTRAINT "SkinAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
