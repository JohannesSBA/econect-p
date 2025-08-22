import { test, expect } from '@playwright/test'

const PAGES = [
  '/en',
  '/en/auth/login',
  '/en/dashboard',
]

test.describe('Nav smoke: click visible links/buttons', () => {
  for (const path of PAGES) {
    test(`page ${path}`, async ({ page }) => {
      await page.goto(path)
      // Limit to internal anchor links only to reduce side-effects
      const clickable = page.locator('a:visible').filter({ hasNot: page.locator('[disabled]') })
      const count = await clickable.count()
      const failures: Array<{ selector: string; href?: string }> = []
      for (let i = 0; i < Math.min(count, 30); i++) {
        const el = clickable.nth(i)
        const tag = await el.evaluate(node => node.tagName.toLowerCase())
        const href = await el.getAttribute('href')
        const oldUrl = page.url()
        try {
          if (!href || href.startsWith('http')) continue
          await el.click({ noWaitAfter: true })
          // If it navigates, wait for network to be idle-ish
          await page.waitForTimeout(200)
          const newUrl = page.url()
          if (newUrl !== oldUrl) {
            const res = await page.request.get(newUrl)
            const status = res.status()
            if (status >= 400) failures.push({ selector: `${tag}[${i}]`, href: newUrl })
            await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {})
          }
        } catch {
          failures.push({ selector: `${tag}[${i}]`, href: href ?? undefined })
        }
      }
      if (failures.length) {
        console.log('Nav failures on', path, failures)
      }
      expect.soft(failures.length).toBe(0)
    })
  }
})

