/*
  Warnings:

  - Made the column `playlistId` on table `ScanHealth` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ScanHealth" ALTER COLUMN "playlistId" SET NOT NULL,
ALTER COLUMN "playlistId" SET DEFAULT '';
