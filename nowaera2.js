const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const bookId = process.argv[2];
const startPage = parseInt(process.argv[3]);
const endPage = parseInt(process.argv[4]);

if (!bookId || !startPage || !endPage) {
  console.log('Usage: node nowaera2.js <bookId> <startPage> <endPage>');
  process.exit(1);
}

const pagesDir = path.join(__dirname, 'pages');
if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir);
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

(async () => {
  const browser = await puppeteer.launch({
  headless: false,
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--start-maximized'
  ],
});

  const page = await browser.newPage();

  const { width, height } = await page.evaluate(() => ({
  width: window.screen.availWidth,
  height: window.screen.availHeight,
}));
await page.setViewport({ width, height });


  // Login manually
  await page.goto('https://neon.nowaera.pl/', { waitUntil: 'networkidle2' });
  console.log('Please log in manually. Press ENTER here when done.');

  process.stdin.resume();
  await new Promise(resolve => process.stdin.once('data', () => resolve()));

  const cookies = await page.cookies();
  fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));
  console.log('Cookies saved.');

  await page.setCookie(...cookies);

  for (let i = startPage; i <= endPage; i++) {
    const svgUrl = `https://neon.nowaera.pl/product/${bookId}/ONLINE/assets/book/pages/${i}/${i}.svg`;
    console.log(`Loading page ${i}: ${svgUrl}`);

    try {
      await page.goto(svgUrl, { waitUntil: 'networkidle2' });
      await delay(2000);

      const svgHandle = await page.$('svg');
      if (!svgHandle) {
        console.log(`SVG not found on page ${i}, skipping.`);
        continue;
      }

      const viewBox = await page.evaluate(svg => {
        const vb = svg.getAttribute('viewBox')?.split(' ').map(Number);
        return vb && vb.length === 4 ? { x: vb[0], y: vb[1], width: vb[2], height: vb[3] } : null;
      }, svgHandle);

      if (!viewBox) {
        console.log(`viewBox not found on page ${i}, skipping.`);
        continue;
      }

      const scale = 3;
      await page.setViewport({
        width: Math.ceil(viewBox.width * scale),
        height: Math.ceil(viewBox.height * scale),
        deviceScaleFactor: 1,
      });

      await page.evaluate((scale) => {
        const svg = document.querySelector('svg');
        svg.style.width = `${svg.viewBox.baseVal.width * scale}px`;
        svg.style.height = `${svg.viewBox.baseVal.height * scale}px`;
        svg.style.background = '#ffffff';
      }, scale);

      const filePath = path.join(pagesDir, `page_${String(i).padStart(3, '0')}.png`);

      await page.screenshot({
        path: filePath,
        clip: {
          x: 0,
          y: 0,
          width: Math.ceil(viewBox.width * scale),
          height: Math.ceil(viewBox.height * scale),
        },
      });

      console.log(`Saved ${filePath}`);
    } catch (e) {
      console.error(`Error on page ${i}:`, e);
    }
  }

  await browser.close();
  process.exit();
})();
