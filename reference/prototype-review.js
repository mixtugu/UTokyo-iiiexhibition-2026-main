(() => {
 const mode = document.documentElement.dataset.prototype;
 if (!mode) return;
 const views = [
  ['works', 'WORKS'],
  ['announce', 'ANNOUNCE'],
  ['members-archives', 'MEMBERS → ARCHIVES']
 ];
 const label = views.find(([key]) => key === mode)?.[1];
 if (!label) return;
 document.title = `${label} — iii Exhibition 2026 prototype`;
 const bar = document.createElement('nav');
 bar.className = 'prototype-review-bar';
 bar.setAttribute('aria-label', 'プロトタイプの切り替え');
 const title = document.createElement('strong');
 title.textContent = `PROTOTYPE / ${label}`;
 bar.append(title);
 for (const [key, name] of views) {
  const link = document.createElement('a');
  link.href = `preview.html?prototype=${key}`;
  link.textContent = name;
  if (key === mode) link.setAttribute('aria-current', 'page');
  bar.append(link);
 }
 const full = document.createElement('a');
 full.href = 'preview.html';
 full.textContent = 'サイト全体 ↗';
 bar.append(full);
 document.body.prepend(bar);
})();
