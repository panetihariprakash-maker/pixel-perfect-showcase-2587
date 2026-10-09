export const pageMeta = (title: string, description: string) => ({ meta: [
  { title: `${title} — Azure Ridge Sanctuary` }, { name: 'description', content: description },
  { property: 'og:title', content: `${title} — Azure Ridge Sanctuary` }, { property: 'og:description', content: description },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
] });