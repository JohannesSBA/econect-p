// app/[lang]/dictionaries.ts

const dictionaries = {
  en: () => import('../dictionaries/en.json').then((module) => module.default),
  am: () => import('../dictionaries/am.json').then((module) => module.default),
  om: () => import('../dictionaries/om.json').then((module) => module.default),
}

export const getDictionary = async (locale: 'en' | 'am' | 'om') => {
  return dictionaries[locale]?.() || dictionaries['en']()
}