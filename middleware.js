import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
 
let headers = { 'accept-language': 'en-US,en;q=0.5' }
let languages = new Negotiator({ headers }).languages()
let locales = ['en-US', 'am-ET', 'om-ET']
let defaultLocale = 'en-US'
 
match(languages, locales, defaultLocale) // -> 'en-US'

export default function middleware(request) {
    const locale = match(request.headers, locales, defaultLocale)
    return NextResponse.next({
        headers: { 'x-custom-lang': locale },
    })
}