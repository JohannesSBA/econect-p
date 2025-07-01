// /app/api/auth/verify/route.ts
import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import hashPassword from '@/lib/utils'
export async function POST(req: NextRequest) {

  const body = await req.json()
  console.log(body)
  const { email, code, firstName, lastName, password, phone } = body

  // 1) Pull & clear our OTP cookie
  const cookie = req.cookies.get('econnect_otp')
  if (!cookie) return NextResponse.json({ error: 'No code found' }, { status: 400 })

  // 2) Decode & validate
  let data: { email: string; otp: string; expires: number }
  try {
    data = JSON.parse(Buffer.from(cookie.value, 'base64').toString())
  } catch {
    return NextResponse.json({ error: 'Invalid code payload' }, { status: 400 })
  }

  if (data.email !== email || data.otp !== code)                      return NextResponse.json({ error: 'Wrong code' }, { status: 400 })
  if (Date.now() > data.expires)                                    return NextResponse.json({ error: 'Code expired' }, { status: 400 })

  // 3) Create the user
  const hashed = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      name:        firstName + ' ' + lastName,
      email,
      phone:       phone,
      role:        'JOB_SEEKER',
      password:    hashed,
    },
  })
  await prisma.jobSeekerProfile.create({
    data: {
      bio: '',
      jobSeeker: {
        connect: {
          id: user.id,
        },
      },
      education: '',
      experiences: {
        create: [],
      },
      skills: {
        create: [],
      },
    },
  })

  // 4) Clear the cookie & return success
  const clearCookie = `econnect_otp=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict`
  return NextResponse.json(
    { message: 'Registration complete', user: { id: user.id, email: user.email } },
    { status: 201, headers: { 'Set-Cookie': clearCookie } }
  )
}
