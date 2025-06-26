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
  login: {
    welcomeTitle: string
    welcomeSubtitle: string
    enterCredentials: string
    continueWithGoogle: string
    orContinueWith: string
    email: string
    phone: string
    emailPlaceholder: string
    phonePlaceholder: string
    password: string
    passwordPlaceholder: string
    rememberMe: string
    forgotPassword: string
    experienceLevel: string
    signIn: string
    noAccount: string
    createAccount: string
    termsAgreement: string
    termsOfService: string
    privacyPolicy: string
    and: string
    agree: string
  }
  register: {
    welcomeTitle: string
    welcomeSubtitle: string
    title: string
    description: string
    button: string
    fillDetails: string
    orRegisterWith: string
    continueWithGoogle: string
    signIn: string
    existingAccountPrompt: string
    experienceLevel: string
    signInLink: string
    firstName: string
    lastName: string
    email: string
    phone: string
    password: string
    confirmPassword: string
    createAccount: string
    emailPlaceholder: string
    alreadyHaveAccount: string
    emailTab: string
    phoneTab: string
    phonePlaceholder: string
    submit: string
    secureRegistration: string
    madeForEthiopia: string
    quickSetup: string
    termsOfService: string
    privacyPolicy: string
    newsletter: string
    agree: string
    and: string
    termsAgreement: string
    location: string
    experience: string
    entryLevel: string
    midLevel: string
    seniorLevel: string
    expertLevel: string
    primaryContact: string
    terms: string
    addisAbaba: string
    direDawa: string
    mekelle: string
    gondar: string
    hawassa: string
    bahirDar: string
    adama: string
    jimma: string
    selectLocation: string
    selectExperience: string
  }
}
