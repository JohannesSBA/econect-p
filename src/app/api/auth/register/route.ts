// /app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Resend } from 'resend'

export async function POST(req: Request) {
  console.log('register')
  const { email, phone } = await req.json()

  // 1) Prevent duplicates
  const [byEmail, byPhone] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { phone } }),
  ])
  if (byEmail)  return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
  if (byPhone) return NextResponse.json({ error: 'Phone already in use' }, { status: 400 })

  // 2) Generate 6-digit OTP
  const otp       = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = Date.now() + 15 * 60 * 1000

  // 3) Pack & encrypt payload into a cookie
  const payload = Buffer.from(JSON.stringify({ email, otp, expires: expiresAt })).toString('base64')
  const expiresDate = new Date(expiresAt).toUTCString()
  const cookie = `econnect_otp=${payload}; Path=/; Expires=${expiresDate}; HttpOnly; Secure; SameSite=Strict`

  // 4) Send email via Resend
  const resend = new Resend(process.env.RESEND_KEY!)
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to:   email,
      subject: 'Your E-Connect verification code',
      html: `
        <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no" name="format-detection">
    <title></title>
    <!--[if (mso 16)]>
    <style type="text/css">
    a {text-decoration: none;}
    </style>
    <![endif]-->
    <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
    <!--[if gte mso 9]>
<noscript>
         <xml>
           <o:OfficeDocumentSettings>
           <o:AllowPNG></o:AllowPNG>
           <o:PixelsPerInch>96</o:PixelsPerInch>
           </o:OfficeDocumentSettings>
         </xml>
      </noscript>
<![endif]-->
    <!--[if !mso]><!-- -->
    <link href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i" rel="stylesheet">
    <!--<![endif]-->
    <!--[if mso]><xml>
    <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
      <w:DontUseAdvancedTypographyReadingMail/>
    </w:WordDocument>
    </xml><![endif]-->
  </head>
  <body class="body">
    <div dir="ltr" class="es-wrapper-color">
      <!--[if gte mso 9]>
			<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
				<v:fill type="tile" color="#f8f9fd"></v:fill>
			</v:background>
		<![endif]-->
      <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper">
        <tbody>
          <tr>
            <td valign="top" class="esd-email-paddings">
              <table cellpadding="0" cellspacing="0" align="center" class="esd-header-popover es-header">
                <tbody>
                  <tr>
                    <td align="center" class="esd-stripe">
                      <table bgcolor="#ffffff" align="center" cellpadding="0" cellspacing="0" width="600" class="es-header-body">
                        <tbody>
                          <tr>
                            <td align="left" class="esd-structure es-p10t es-p15b es-p30r es-p30l">
                              <table cellpadding="0" cellspacing="0" width="100%">
                                <tbody>
                                  <tr>
                                    <td width="540" align="center" valign="top" class="esd-container-frame">
                                      <table cellpadding="0" cellspacing="0" width="100%" role="presentation">
                                        <tbody>
                                          <tr>
                                            <td align="center" class="esd-empty-container" style="display: none">
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table cellpadding="0" cellspacing="0" align="center" class="es-content">
                <tbody>
                  <tr>
                    <td align="center" bgcolor="#f8f9fd" class="esd-stripe" style="background-color:#f8f9fd">
                      <table bgcolor="transparent" align="center" cellpadding="0" cellspacing="0" width="600" class="es-content-body" style="background-color:transparent">
                        <tbody>
                          <tr>
                            <td align="left" class="esd-structure es-p20t es-p10b es-p20r es-p20l">
                              <table cellpadding="0" cellspacing="0" width="100%">
                                <tbody>
                                  <tr>
                                    <td width="560" align="center" valign="top" class="esd-container-frame">
                                      <table cellpadding="0" cellspacing="0" width="100%">
                                        <tbody>
                                          <tr>
                                            <td align="center" class="esd-block-text es-p10b">
                                              <h1 style="color:#212121">
                                                Welcome To Econnect
                                              </h1>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td align="center" class="esd-block-text es-p10t es-p10b">
                                              <p>
                                                Your OTP Verification Code is
                                              </p>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td align="left" class="esd-structure es-p15t es-m-p15t es-m-p0b es-m-p0r es-m-p0l">
                              <table cellpadding="0" cellspacing="0" width="100%">
                                <tbody>
                                  <tr>
                                    <td width="600" align="center" valign="top" class="esd-container-frame">
                                      <table cellpadding="0" cellspacing="0" width="100%">
                                        <tbody>
                                          <tr>
                                            <td align="center" class="esd-block-text es-text-6397">
                                              <h6 class="es-text-mobile-size-36" style="line-height: 300%; font-size: 36px">
                                                <strong>${otp}</strong>
                                              </h6>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td align="center" class="esd-block-image" style="font-size:0px">
                                              <a target="_blank">
                                                <img src="https://hpy.stripocdn.email/content/guids/CABINET_1ce849b9d6fc2f13978e163ad3c663df/images/3991592481152831.png" alt="" width="600" class="adapt-img" style="display:block">
                                              </a>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table cellpadding="0" cellspacing="0" align="center" class="es-content">
                <tbody>
                  <tr>
                    <td align="center" bgcolor="#071f4f" class="esd-stripe" style="background-color:#071f4f">
                      <table bgcolor="#ffffff" align="center" cellpadding="0" cellspacing="0" width="600" background="https://hpy.stripocdn.email/content/guids/CABINET_1ce849b9d6fc2f13978e163ad3c663df/images/10801592857268437.png" class="es-content-body" style="background-image:url(https://hpy.stripocdn.email/content/guids/CABINET_1ce849b9d6fc2f13978e163ad3c663df/images/10801592857268437.png);background-repeat:no-repeat;background-position:center top">
                        <tbody>
                          <tr>
                            <td align="left" class="esd-structure es-p40t es-p40b es-p30r es-p30l">
                              <table cellpadding="0" cellspacing="0" width="100%">
                                <tbody>
                                  <tr>
                                    <td width="540" align="center" valign="top" class="esd-container-frame">
                                      <table cellpadding="0" cellspacing="0" width="100%">
                                        <tbody>
                                          <tr>
                                            <td align="center" height="20" class="esd-block-spacer"></td>
                                          </tr>
                                          <tr>
                                            <td align="left" class="esd-block-text es-p10b">
                                              <h1 style="text-align:center;color:#ffffff">
                                                Stripes —&nbsp;Go beyond the boundaries
                                              </h1>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td align="center" class="esd-block-text es-p10t es-p10b">
                                              <p style="color:#ffffff">
                                                Whether you need to make an email background, expand a banner, or highlight the content, just set stripe color.
                                              </p>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>
      `,
    })
    return NextResponse.json(
      { message: 'Verification code sent' },
      { status: 200, headers: { 'Set-Cookie': cookie } }
    )
  } catch (err) {
    console.error('Resend error:', err)
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 })
  }
}
