-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'ACCEPTED', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- Normalize legacy TEXT values (e.g. 'pending') to enum labels
UPDATE "JobApplication"
SET "status" = CASE UPPER("status")
  WHEN 'PENDING' THEN 'PENDING'
  WHEN 'REVIEWING' THEN 'REVIEWING'
  WHEN 'SHORTLISTED' THEN 'SHORTLISTED'
  WHEN 'INTERVIEWED' THEN 'INTERVIEWED'
  WHEN 'ACCEPTED' THEN 'ACCEPTED'
  WHEN 'HIRED' THEN 'HIRED'
  WHEN 'REJECTED' THEN 'REJECTED'
  WHEN 'WITHDRAWN' THEN 'WITHDRAWN'
  ELSE 'PENDING'
END;

-- AlterTable
ALTER TABLE "JobApplication" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "JobApplication" ALTER COLUMN "status" TYPE "ApplicationStatus" USING ("status"::"ApplicationStatus");
ALTER TABLE "JobApplication" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"ApplicationStatus";

-- Align Education enum type name with Prisma schema
ALTER TYPE "degreeType" RENAME TO "DegreeType";
