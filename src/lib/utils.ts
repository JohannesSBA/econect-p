import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Dictionary = {
  header: {
    login: string
  }
  language: string
  hero: {
    innovative: string
    title: string
    description: string
    cta: {
      getStarted: string
      learnMore: string
    }
    demo: {
      badge: string
      title: string
      searchPlaceholder: string
      locationPlaceholder: string
      jobs: Array<{
        title: string
        company: string
        salary: string
      }>
      perMonth: string
    }
  }
  features: {
    title: string
    heading: string
    description: string
    list: Array<{
      title: string
      description: string
    }>
  }
  stats: {
    list: Array<{
      number: string
      label: string
    }>
  }
  cta: {
    heading: string
    description: string
    buttons: {
      signUp: string
      browseJobs: string
    }
  }
  footer: {
    description: string
    copyright: string
  }
}
