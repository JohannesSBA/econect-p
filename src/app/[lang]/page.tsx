import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import {
  Smartphone,
  Zap,
  Shield,
  MessageCircle,
  Search,
  Users,
  TrendingUp,
  Star,
  ArrowRight,
  Globe,
  Clock,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getDictionary } from "./dictionaries"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import LandingJobListings from "@/components/LandingJobListings"

type Dictionary = {
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


export default async function LandingPage({ params }: { params: Promise<{ lang: 'en' | 'am' | 'om' }> }) {

  const { lang } = await params
  
  const dict = await getDictionary(lang) as Dictionary

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Image src="/icon1.png" alt="Econnect" width={32} height={32} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Econnect
            </span>
            
          </div>
         
          
          <div className="flex items-center space-x-4">
             <DropdownMenu>
            <DropdownMenuTrigger className="p-3 text-black text-xs font-bold hover:bg-gray-100 bg-white border border-gray-200 rounded-md">
              {dict.language + ": " + lang}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white text-black">
              <DropdownMenuItem><Link href="/en" className="w-full justify-start">
              <Button variant="default" className="px-3 hover:bg-gray-100 w-full text-start" aria-label="Amharic">
                EN
              </Button>
            </Link></DropdownMenuItem>

              <DropdownMenuItem><Link href="/am" className="w-full justify-start">
              <Button variant="default" className="px-3 hover:bg-gray-100 w-full text-start" aria-label="Amharic">
                AM
              </Button>
            </Link></DropdownMenuItem>
              <DropdownMenuItem><Link href="/om" className="w-full justify-start">
              <Button variant="default" className="px-3 hover:bg-gray-100 w-full text-start" aria-label="Oromo">
                OM
              </Button>
            </Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
            
            
            
            <Link href="/login">
              <Button variant="outline" className="bg-white text-blue-600 cursor-pointer border-blue-200 hover:bg-blue-50">
                {dict.header.login}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-teal-600/10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  {dict.hero.innovative}
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-black">
                  {dict.hero.title}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {dict.hero.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                >
                  {dict.hero.cta.getStarted}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50 px-8 py-3"
                >
                  {dict.hero.cta.learnMore}
                </Button>
              </div>

              {/* <div className="flex items-center space-x-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">10K+</div>
                  <div className="text-sm text-gray-600">Active Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">5K+</div>
                  <div className="text-sm text-gray-600">Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">50K+</div>
                  <div className="text-sm text-gray-600">Job Seekers</div>
                </div>
              </div> */}
            </div>

            <LandingJobListings />
            
          </div>
        </div>
      </section>

      {/* Get Employed Faster Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-purple-100 text-purple-700">{dict.features.title}</Badge>
            <h2 className="text-3xl lg:text-4xl text-black font-bold">{dict.features.heading}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {dict.features.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-black">
            {[
              {
                icon: Smartphone,
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Zap,
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Shield,
                color: "from-green-500 to-teal-500",
              },
              {
                icon: MessageCircle,
                color: "from-orange-500 to-red-500",
              },
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8 text-center space-y-4">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">{dict.features.list[index].title}</h3>
                  <p className="text-gray-600 leading-relaxed">{dict.features.list[index].description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            {[
              { icon: TrendingUp },
              { icon: Clock },
              { icon: Users },
              { icon: Star },
            ].map((stat, index) => (
              <div key={index} className="space-y-4">
                <stat.icon className="h-12 w-12 mx-auto opacity-80" />
                <div className="text-4xl font-bold">{dict.stats.list[index].number}</div>
                <div className="text-blue-100">{dict.stats.list[index].label}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-black">{dict.cta.heading}</h2>
            <p className="text-xl text-gray-600">
              {dict.cta.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
              >
                {dict.cta.buttons.signUp}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50 px-8 py-3"
              >
                {dict.cta.buttons.browseJobs}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="text-xl font-bold">Econnect</span>
              </div>
              <p className="text-gray-400">
                {dict.footer.description}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Marketing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Analytics
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Automation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Commerce
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Insights
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Legal
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    License
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>{dict.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
