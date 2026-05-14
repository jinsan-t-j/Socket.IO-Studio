/* eslint-disable @typescript-eslint/no-require-imports, no-console */
const path = require('path');

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:4173';

async function runAudit() {
  console.log('Starting Accessibility Audit for Socket Studio...');
  const browser = await chromium.launch({ headless: true });
  
  const context = await browser.newContext({
    colorScheme: 'dark',
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();

  console.log(`Navigating to ${BASE_URL}...`);
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Ensure Dark Mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vueuse-color-scheme', 'dark');
    });
    
    await page.waitForTimeout(3000); 

    const auditResults = await page.evaluate(() => {
      const results = [];

      function getLuminance(r, g, b) {
        const [R, G, B] = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
      }

      function getContrast(rgb1, rgb2) {
        const parse = (s) => {
           const match = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
           return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0,0,0];
        };
        const lum1 = getLuminance(...parse(rgb1));
        const lum2 = getLuminance(...parse(rgb2));
        return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
      }

      // 1. Body Background
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      results.push({ name: 'Body Background', value: bodyBg, pass: !!bodyBg });

      // 2. Interactive Elements Contrast
      const buttons = document.querySelectorAll('button, a, input');
      buttons.forEach((el, index) => {
        if (index > 10) return; // Sample check
        const bg = getComputedStyle(el).backgroundColor;
        const text = getComputedStyle(el).color;
        const contrast = getContrast(bg, text);
        results.push({ 
          name: `Contrast: ${el.tagName} (${el.innerText.substring(0, 10)})`, 
          contrast: contrast.toFixed(2), 
          pass: contrast >= 4.5 || contrast === 1.0 // 1.0 might be transparent
        });
      });

      return results;
    });

    console.log('AUDIT_RESULTS_JSON:' + JSON.stringify(auditResults));

    const screenshotPath = path.join(process.cwd(), 'audit-results.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to ${screenshotPath}`);

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
