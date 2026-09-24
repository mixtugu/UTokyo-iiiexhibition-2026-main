import type { Work } from '../types';
export function createWorks(): Work[] {
  const works: Work[] = [
    {
      title: 'Memory Landscapes',
      image: 'assets/works/memory-landscapes.png',
      description:
        '記憶をテーマにしたVRの中で、思い出の中をたゆたう。懐かしさを手がかりに、過去の記憶と新しい体験が重なる作品。',
    },
    {
      title: 'Mollusk',
      image: 'assets/works/mollusk.png',
      description:
        '見慣れたパッケージの中に置かれた、不思議なかたち。画像から作品を選び、詳細を開く体験のサンプルです。',
    },
  ];
  works.forEach((w, i) => {
    w.venue = String(i);
    w.author = '';
  });
  // Seeded shuffle: random-looking placement stays stable after a reload.
  const venues = Array.from({ length: 28 }, (_, i) => String(i % 2));
  let seed = 20260919;
  for (let i = venues.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((seed / 4294967296) * (i + 1));
    [venues[i], venues[j]] = [venues[j], venues[i]];
  }
  for (let i = works.length; i < 30; i++) {
    const n = String(i + 1).padStart(2, '0');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="hsl(${80 + i * 7},18%,85%)"/><text x="300" y="305" text-anchor="middle" font-family="serif" font-size="110" fill="#526963">${n}</text><text x="300" y="375" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#526963">PLACEHOLDER</text></svg>`;
    works.push({
      title: '仮作品 ' + n,
      author: '',
      placeholder: true,
      venue: venues[i - 2],
      image: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      description:
        '30点での操作確認用の仮枠です。作品名・作者・画像は未登録で、会場は仮の割り振りです。',
    });
  }
  return works;
}
