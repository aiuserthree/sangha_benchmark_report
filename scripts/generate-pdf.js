const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

const PAGE_ORDER = [
  '01-benchmark-report-page.html',
  '00-index.html',
  '00a-section1.html',
  '02-report-meta-page.html',
  '03-analysis-purpose-scope-page.html',
  '04-site-diagnosis-page.html',
  '05-pain-points-page.html',
  '00b-section2.html',
  '06-market-trends-page.html',
  '07-cx-o2o-trends-page.html',
  '00c-section3.html',
  '08-benchmark-overview-page.html',
  '09-d1-everland-page.html',
  '10-d2-inspire-page.html',
  '11-d3-paradise-page.html',
  '12-direct-others-page.html',
  '13-indirect-inspire-page.html',
  '14-matrix-page.html',
  '15-insight-page.html',
  '16-recommendation-roadmap-1-page.html',
  '17-recommendation-roadmap-2-page.html',
  '18-summary-page.html',
  '19-eod-page.html',
];

const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

async function generatePdf() {
  const baseDir = path.resolve(__dirname, '..');
  const htmlDir = path.join(baseDir, 'html');
  const pdfDir = path.join(baseDir, 'pdf');
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setViewport({ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, deviceScaleFactor: 1 });

  const pdfBuffers = [];

  for (let i = 0; i < PAGE_ORDER.length; i++) {
    const file = PAGE_ORDER[i];
    const filePath = path.join(htmlDir, file);
    const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.evaluate(() => document.body.style.background = '#fff');
    const pdfBuf = await page.pdf({
      width: `${SLIDE_WIDTH}px`,
      height: `${SLIDE_HEIGHT}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    pdfBuffers.push(pdfBuf);
  }

  await browser.close();

  const mergedPdf = await PDFDocument.create();
  for (const buf of pdfBuffers) {
    const src = await PDFDocument.load(buf);
    const pages = await mergedPdf.copyPages(src, src.getPageIndices());
    pages.forEach(p => mergedPdf.addPage(p));
  }

  const outPath = path.join(pdfDir, 'sangha_benchmark_report_full.pdf');
  fs.writeFileSync(outPath, await mergedPdf.save());
  console.log('PDF saved:', outPath);
}

generatePdf().catch(err => {
  console.error(err);
  process.exit(1);
});
