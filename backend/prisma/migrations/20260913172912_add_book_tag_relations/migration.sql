-- AlterTable
ALTER TABLE "Book" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updateAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "completedAt" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Book_status_idx" ON "Book"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- AddForeignKey
ALTER TABLE "BookTag" ADD CONSTRAINT "BookTag_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookTag" ADD CONSTRAINT "BookTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;