// /app/api/auth/verify/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import prisma from '@/lib/prisma'
import hashPassword from '@/lib/utils'
import { rateLimit } from '@/lib/rateLimiter'
export async function POST(req: NextRequest) {

  const limitResult = rateLimit(req, 'auth:verify', 5, 10 * 60 * 1000)
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limitResult.retryAfterSeconds}s.` },
      {
        status: 429,
        headers: { 'Retry-After': String(limitResult.retryAfterSeconds) },
      },
    )
  }

  const body = await req.json()
  const { email, code, firstName, lastName, password, phone, accountType, companyName, website } = body

  if (!email || !code || !firstName || !lastName || !password || !phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 1) Pull & clear our OTP cookie
  const cookie = req.cookies.get('econnect_otp')
  if (!cookie) return NextResponse.json({ error: 'No code found' }, { status: 400 })

  // 2) Decode & validate
  const otpSecret = process.env.OTP_SECRET || process.env.NEXTAUTH_SECRET
  if (!otpSecret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const [payload, providedSig] = cookie.value.split('.')
  if (!payload || !providedSig) {
    return NextResponse.json({ error: 'Invalid code payload' }, { status: 400 })
  }

  const expectedSig = createHmac('sha256', otpSecret).update(payload).digest('hex')
  const validSig =
    expectedSig.length === providedSig.length &&
    timingSafeEqual(Buffer.from(expectedSig), Buffer.from(providedSig))
  if (!validSig) return NextResponse.json({ error: 'Invalid code payload' }, { status: 400 })

  let data: { email: string; otp: string; expires: number }
  try {
    data = JSON.parse(Buffer.from(payload, 'base64').toString())
  } catch {
    return NextResponse.json({ error: 'Invalid code payload' }, { status: 400 })
  }

  if (data.email !== email || data.otp !== code)                      return NextResponse.json({ error: 'Wrong code' }, { status: 400 })
  if (Date.now() > data.expires)                                    return NextResponse.json({ error: 'Code expired' }, { status: 400 })

  const normalizedRole =
    accountType === 'EMPLOYER'
      ? 'EMPLOYER'
      : accountType === 'JOB_SEEKER'
        ? 'JOB_SEEKER'
        : null
  if (!normalizedRole) return NextResponse.json({ error: 'Invalid account type' }, { status: 400 })

  // 3) Create the user
  const hashed = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      name:        firstName + ' ' + lastName,
      email,
      phone:       phone,
      role:        normalizedRole,
      password:    hashed,
    },
  })
  if (normalizedRole === 'EMPLOYER') {
    await prisma.employerProfile.create({
      data: {
        userId: user.id,
        companyName: companyName || firstName + ' ' + lastName,
        website: website || null,
      },
    })
  } else {
    await prisma.jobSeekerProfile.create({
    data: {
      bio: '',
      jobSeeker: {
        connect: {
          id: user.id,
        },
      },
      education: {
        create: [],
      },
      experiences: {
        create: [],
      },
      skills: {
        create: [],
      },
    },
  })
  }

  // 4) Clear the cookie & return success
  const clearCookie = `econnect_otp=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict`
  return NextResponse.json(
    { message: 'Registration complete', user: { id: user.id, email: user.email } },
    { status: 201, headers: { 'Set-Cookie': clearCookie } }
  )
}
