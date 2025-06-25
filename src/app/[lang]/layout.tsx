export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'am' }, { lang: 'om' }]
}
 
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: 'en' | 'am' | 'om' }>
}>) {
  return (
    <html lang={(await params).lang}>
      <body>{children}</body>
    </html>
  )
}