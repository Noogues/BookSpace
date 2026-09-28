import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

const TOP_TAGS_LIMIT = 12
const STATUS_VALUES = [0, 1, 2, 3]

export async function statsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/stats', async () => {
    const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))

    const [totalBooks, chapters, rated, byStatus, topTags, completedThisYear, addedThisYear] =
      await Promise.all([
        prisma.book.count(),
        prisma.book.aggregate({ _sum: { lastChapter: true } }),
        prisma.book.aggregate({
          where: { rating: { gt: 0 } },
          _avg: { rating: true },
          _count: { _all: true },
        }),
        prisma.book.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.tag.findMany({
          take: TOP_TAGS_LIMIT,
          orderBy: { books: { _count: 'desc' } },
          select: { name: true, _count: { select: { books: true } } },
        }),
        prisma.book.count({
          where: { status: 2, completedAt: { gte: yearStart } },
        }),
        prisma.book.count({ where: { createdAt: { gte: yearStart } } }),
      ])

    const byStatusMap = new Map(byStatus.map((row) => [row.status, row._count._all]))

    return {
      totalBooks,
      totalChapters: chapters._sum.lastChapter ?? 0,
      averageRating: rated._avg.rating ?? 0,
      ratedBooks: rated._count._all,
      completedThisYear,
      addedThisYear,
      byStatus: STATUS_VALUES.map((status) => ({ status, count: byStatusMap.get(status) ?? 0 })),
      topTags: topTags
        .filter((tag) => tag._count.books > 0)
        .map((tag) => ({ name: tag.name, count: tag._count.books })),
    }
  })
}
