export interface Tag {
  id: number
  name: string
}

export interface TagWithCount extends Tag {
  _count: { books: number }
}

export interface BookTag {
  bookId: number
  tagId: number
  tag: Tag
}

export interface Book {
  id: number
  name: string
  secundaryName: string | null
  url: string
  lastChapter: number
  status: number
  rating: number
  coverPath: string | null
  createdAt: string
  updateAt: string
  completedAt: string | null
  tags: BookTag[]
}

export interface PaginatedBooks {
  total: number
  page: number
  pageSize: number
  items: Book[]
}

export interface FilterValues {
  name: string
  status: string
  tags: string[]
  sort: string
  order: string
}

export interface BookFilters {
  name?: string
  status?: number
  tag?: string[]
  sort?: 'updated' | 'added' | 'name'
  order?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface BookInput {
  name: string
  secundaryName?: string
  url: string
  lastChapter: number
  status: number
  rating: number
  coverPath?: string
  completedAt?: string
  tags: string[]
}

export interface BookUpdateInput {
  name?: string
  secundaryName?: string
  url?: string
  lastChapter?: number
  status?: number
  rating?: number
  coverPath?: string
  completedAt?: string
  tags?: string[]
}

export interface ExcelRowError {
  row: number
  error: string
}

export interface ImportResult {
  imported: number
  errors?: ExcelRowError[]
}

export const BOOK_STATUS = {
  PENDING: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  DROPPED: 3,
} as const