-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientRef" TEXT,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "label" TEXT,
    "imageUrl" TEXT,
    "parentId" INTEGER,
    "customFields" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("clientId", "clientRef", "createdAt", "customFields", "description", "id", "imageUrl", "label", "name", "parentId", "updatedAt") SELECT "clientId", "clientRef", "createdAt", "customFields", "description", "id", "imageUrl", "label", "name", "parentId", "updatedAt" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_clientRef_clientId_key" ON "Category"("clientRef", "clientId");
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientRef" TEXT,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "label" TEXT,
    "imageUrl" TEXT,
    "tags" TEXT,
    "categoryId" INTEGER,
    "customFields" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "clientId", "clientRef", "createdAt", "customFields", "description", "id", "imageUrl", "label", "name", "tags", "updatedAt") SELECT "categoryId", "clientId", "clientRef", "createdAt", "customFields", "description", "id", "imageUrl", "label", "name", "tags", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_clientRef_clientId_key" ON "Product"("clientRef", "clientId");
CREATE TABLE "new_Variant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientRef" TEXT,
    "clientId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "label" TEXT,
    "imageUrl" TEXT,
    "productId" INTEGER,
    "categoryId" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "attributes" JSONB,
    "customFields" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Variant_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Variant_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Variant" ("attributes", "categoryId", "clientId", "clientRef", "createdAt", "customFields", "description", "id", "imageUrl", "label", "name", "productId", "sku", "stock", "updatedAt") SELECT "attributes", "categoryId", "clientId", "clientRef", "createdAt", "customFields", "description", "id", "imageUrl", "label", "name", "productId", "sku", "stock", "updatedAt" FROM "Variant";
DROP TABLE "Variant";
ALTER TABLE "new_Variant" RENAME TO "Variant";
CREATE UNIQUE INDEX "Variant_sku_key" ON "Variant"("sku");
CREATE UNIQUE INDEX "Variant_clientRef_clientId_key" ON "Variant"("clientRef", "clientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
