const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
  });

  try {
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem('token', 'dummy-token');
    });
    await page.goto('http://localhost:8080/investigator', { waitUntil: 'networkidle2' });
    // Wait a bit
    await new Promise(r => setTimeout(r, 3000));
  } catch (err) {
    console.error('Error navigating:', err);
  } finally {
    await browser.close();
  }
})();
