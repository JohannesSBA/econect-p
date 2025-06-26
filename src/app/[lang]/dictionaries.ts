import 'server-only' // Ensures this file is server-only in Next.js

const cache = new Map<string, any>()

const dictionaries = {
  en: () => import('../dictionaries/en.json').then((module) => module.default),
  am: () => import('../dictionaries/am.json').then((module) => module.default),
  om: () => import('../dictionaries/om.json').then((module) => module.default),
}

export const getDictionary = async (locale: 'en' | 'am' | 'om') => {
  if (cache.has(locale)) {
    return cache.get(locale)
  }

  const dict = await (dictionaries[locale]?.() || dictionaries['en']())
  cache.set(locale, dict)
  return dict
}
