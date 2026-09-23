import { Library, Tags, Upload } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', key: 'nav.home', icon: Library, end: true },
  { to: '/tags', key: 'nav.categories', icon: Tags, end: false },
  { to: '/import', key: 'nav.import', icon: Upload, end: false },
] as const