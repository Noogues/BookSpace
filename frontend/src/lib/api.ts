import axios from 'axios'
import type {
  Book,
  BookFilters,
  BookInput,
  BookUpdateInput,
  ExcelRowError,
  ImportResult,
  PaginatedBooks,
  Tag,
  TagWithCount,
} from './types'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  paramsSerializer: { indexes: null },
})

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !String(error.config?.url ?? '').startsWith('/auth/') &&
      unauthorizedHandler
    ) {
      unauthorizedHandler()
    }
    return Promise.reject(error)
  },
)

export async function login(username: string, password: string): Promise<{ username: string }> {
  const { data } = await api.post<{ username: string }>('/auth/login', { username, password })
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function me(): Promise<{ username: string } | null> {
  try {
    const { data } = await api.get<{ username: string }>('/auth/me')
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return null
    throw error
  }
}

export async function listBooks(filters: BookFilters = {}): Promise<PaginatedBooks> {
  const { data } = await api.get<PaginatedBooks>('/books', { params: filters })
  return data
}

export async function getBook(id: number): Promise<Book> {
  const { data } = await api.get<Book>(`/books/${id}`)
  return data
}

export async function createBook(input: BookInput): Promise<Book> {
  const { data } = await api.post<Book>('/books', input)
  return data
}

export async function updateBook(id: number, input: BookUpdateInput): Promise<Book> {
  const { data } = await api.patch<Book>(`/books/${id}`, input)
  return data
}

export async function deleteBook(id: number): Promise<void> {
  await api.delete(`/books/${id}`)
}

export async function importExcel(file: File): Promise<ImportResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<ImportResult>('/books/import', form)
  return data
}

export async function uploadCover(file: File): Promise<{ path: string }> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<{ path: string }>('/covers', form)
  return data
}

export async function listTags(): Promise<TagWithCount[]> {
  const { data } = await api.get<TagWithCount[]>('/tags')
  return data
}

export async function createTag(name: string): Promise<Tag> {
  const { data } = await api.post<Tag>('/tags', { name })
  return data
}

export async function deleteTag(id: number): Promise<void> {
  await api.delete(`/tags/${id}`)
}

export async function checkHealth(): Promise<{ status: string }> {
  const { data } = await api.get<{ status: string }>('/health')
  return data
}

export function errorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}

export function errorData(error: unknown): {
  error?: string
  errors?: ExcelRowError[]
} | undefined {
  if (!axios.isAxiosError(error)) return undefined
  return error.response?.data as { error?: string; errors?: ExcelRowError[] } | undefined
}