import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

export const dynamic = 'force-dynamic';

export async function GET() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    args: [
       '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
       '--ignore-certificate-errors',
       '--proxy-server=http://brd.superproxy.io:33335'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.authenticate({
       username: 'brd-customer-hl_84a2f091-zone-climatic_residential_proxy1',
       password: 'rp8n9mk1zqrb'
    });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9,ro;q=0.8' });
    const url = 'https://www.vexio.ro/aer-conditionat/midea/2707780-xtreme-fresh-msagbu-12hrfnx-qrd0gw-mox102-12hfn8-qrd0gw-inverter-12000-btu-clasa-a-plus-plus-filtru-hepa-wifi-auto-curatare-cu-sterilizare/';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const html = await page.content();
    await browser.close();
    
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err: any) {
    await browser.close();
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
