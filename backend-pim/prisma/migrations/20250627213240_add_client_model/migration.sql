/*
  Warnings:

  - Added the required column `clientId` to the `Attribute` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attribute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    CONSTRAINT "Attribute_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attribute" ("id", "name", "type") SELECT "id", "name", "type" FROM "Attribute";
DROP TABLE "Attribute";
ALTER TABLE "new_Attribute" RENAME TO "Attribute";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
