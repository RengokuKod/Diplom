const puppeteer = require('puppeteer');

const dnsCategories = {
  'Маршрутизаторы': 'https://www.dns-shop.ru/catalog/17a892f816404e77/marshrutizatory/',
  'Коммутаторы': 'https://www.dns-shop.ru/catalog/17a8932c16404e77/kommutatory/',
  'Беспроводные точки доступа': 'https://www.dns-shop.ru/catalog/17a8936816404e77/besprovodnye-tochki-dostupa/',
  'Сетевые адаптеры': 'https://www.dns-shop.ru/catalog/17a8945416404e77/setevye-adaptery/',
  'Модемы': 'https://www.dns-shop.ru/catalog/17a894bc16404e77/modemy/',
  'Кабели и аксессуары': 'https://www.dns-shop.ru/catalog/17a8952416404e77/kabeli-i-adaptery/',
  'Серверное оборудование': 'https://www.dns-shop.ru/catalog/17a896e016404e77/servernoe-oborudovanie/',
  'IP-камеры': 'https://www.dns-shop.ru/catalog/17a89d3616404e77/ip-kamery/',
  'Сетевые хранилища (NAS)': 'https://www.dns-shop.ru/catalog/17a8974816404e77/setevye-khranilishcha/',
  'VoIP-телефоны': 'https://www.dns-shop.ru/catalog/17a897b016404e77/voip-telefony/'
};

async function parseProductImagesFromDNS(categoryUrl, productName) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true // Без указания executablePath, Puppeteer использует встроенный Chromium
    });
    const page = await browser.newPage();

    await page.goto(categoryUrl, { waitUntil: 'networkidle2' });

    const productLink = await page.evaluate((name) => {
      const items = Array.from(document.querySelectorAll('.catalog-product__name'));
      const item = items.find(el => el.textContent.toLowerCase().includes(name.toLowerCase()));
      return item ? item.querySelector('a').href : null;
    }, productName);

    if (!productLink) {
      await browser.close();
      return [];
    }

    await page.goto(productLink, { waitUntil: 'networkidle2' });

    const images = await page.evaluate(() => {
      const imgElements = Array.from(document.querySelectorAll('.product-images-slider__item img'));
      return imgElements.slice(0, 3).map(img => img.src);
    });

    await browser.close();
    return images;
  } catch (error) {
    console.error(`Ошибка в parseProductImagesFromDNS: ${error.message}`);
    if (browser) await browser.close();
    return [];
  }
}

module.exports = { parseProductImagesFromDNS, dnsCategories };