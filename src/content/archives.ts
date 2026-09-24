import type { Archive } from '../types';
export const fallbackArchives: Archive[] = [
  {
    group: 'ARCHIVES',
    year: '2024',
    title: 'なにいう展',
    image: 'assets/archive/extra-2024.png',
    url: 'https://iii-exhibition-2024-web.vercel.app/',
  },
  {
    group: 'ARCHIVES',
    year: '2023',
    title: 'voidage',
    image: 'assets/archive/extra-2023.jpg',
    url: 'https://iii-exhibition2023.vercel.app/',
  },
  {
    group: 'ARCHIVES',
    year: '2023',
    title: '學藝運動',
    image: 'assets/archive/main-2023.png',
    url: 'https://iii-exhibition2023-main.vercel.app/',
  },
];

export function isArchiveCatalog(value: unknown): value is Archive[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        ['group', 'year', 'title', 'url'].every(
          (key) => typeof item[key] === 'string',
        ) &&
        /^https?:\/\//.test(item.url) &&
        (item.image === undefined || typeof item.image === 'string'),
    )
  );
}
