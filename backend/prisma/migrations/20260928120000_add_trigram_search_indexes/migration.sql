-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateIndex
CREATE INDEX "Book_name_trgm_idx" ON "Book" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Book_secundaryName_trgm_idx" ON "Book" USING GIN ("secundaryName" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Book_url_trgm_idx" ON "Book" USING GIN ("url" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Tag_name_trgm_idx" ON "Tag" USING GIN ("name" gin_trgm_ops);
