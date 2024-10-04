const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const puppeteer = require('puppeteer');
const cron = require('node-cron');
const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const axios = require('axios'); // For IndexNow submission
require('dotenv').config();

const app = express();

// Middleware setup
app.use(express.json());
app.use(bodyParser.json());
app.use('/favicon', express.static(path.join(__dirname, 'favicon')));
app.use(express.static(path.join(__dirname)));

// Routes setup
const routes = require('./routes');
app.use('/', routes);  

const DOWNLOAD_DIR = path.join(__dirname, 'downloadedfile');

// Ensure the download directory exists
fs.mkdir(DOWNLOAD_DIR, { recursive: true }).catch(console.error);

let browser;

const hostname = 'https://scribdpdfdownloader.com';

const urls = [
  { url: '/', changefreq: 'daily', priority: 1.0, lastmod: new Date() },
  { url: '/about', changefreq: 'monthly', priority: 0.9, lastmod: new Date() },
  { url: '/privacy-policy', changefreq: 'monthly', priority: 0.8, lastmod: new Date() },
  { url: '/disclaimer', changefreq: 'monthly', priority: 0.8, lastmod: new Date() },
  { url: '/terms-of-service', changefreq: 'monthly', priority: 0.8, lastmod: new Date() },
  { url: '/blog', changefreq: 'monthly', priority: 0.9, lastmod: new Date() },
  { url: '/contact', changefreq: 'monthly', priority: 0.9, lastmod: new Date() },
  { url: '/how-to-read-scribd-files-for-free', changefreq: 'monthly', priority: 0.9, lastmod: new Date() },
  { url: '/where-to-find-downloaded-scribd-files', changefreq: 'monthly', priority: 0.9, lastmod: new Date() },
  { url: '/how-to-download-scribd-documents-as-pdf', changefreq: 'monthly', priority: 0.9, lastmod: new Date() },
  { url: '/how-much-is-scribd-monthly-subscription', changefreq: 'monthly', priority: 0.9, lastmod: new Date() },
  { url: '/how-to-get-a-refund-from-scribd', changefreq: 'monthly', priority: 0.9, lastmod: new Date() },
  { url: '/how-to-cancel-scribd-subscription', changefreq: 'monthly', priority: 0.9, lastmod: new Date() },
  { url: '/404.html', changefreq: 'monthly', priority: 0.9, lastmod: new Date() },
  { url: '/sitemap.xml', changefreq: 'weekly', priority: 0.5, lastmod: new Date() }, // Sitemap file
  { url: '/robots.txt', changefreq: 'monthly', priority: 0.5, lastmod: new Date() }  // Robots.txt file
];

const sitemap = new SitemapStream({ hostname });

urls.forEach((url) => sitemap.write(url));
sitemap.end();

streamToPromise(sitemap).then((data) => {
  createWriteStream('./sitemap.xml').write(data);
  submitToIndexNow(urls.map(u => hostname + u.url)); // Auto-submit updated URLs to IndexNow
});

// Function to submit URLs to IndexNow
async function submitToIndexNow(urlList) {
    const key = '5d72b8c4b3744971b8a96575bd7760ed';
    const keyLocation = `https://scribdpdfdownloader.com/${key}.txt`;
  
    const requestBody = {
      host: 'scribdpdfdownloader.com',
      key: key,
      keyLocation: keyLocation,
      urlList: urlList
    };
  
    try {
      const response = await axios.post('https://api.indexnow.org/indexnow', requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('URLs submitted to IndexNow:', response.data);
    } catch (error) {
      console.error('Error submitting URLs to IndexNow:', error.message);
    }
  }

// Function to login and save cookies
async function loginAndSaveCookies(page) {
    try {
        await page.goto('https://www.scribd.com/login', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[name="username"]');
        await page.type('input[name="username"]', process.env.SCRIBD_EMAIL, { delay: 100 });
        await page.waitForSelector('input[name="password"]');
        await page.type('input[name="password"]', process.env.SCRIBD_PASSWORD, { delay: 100 });

        console.log("Please solve the reCAPTCHA manually.");
        await page.waitForSelector('button[type="submit"]');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        const cookies = await page.cookies();
        await fs.writeFile('cookies.json', JSON.stringify(cookies));
        console.log("Login successful and cookies saved.");
    } catch (error) {
        console.error('Error during login and save cookies:', error);
    }
}

// Function to ensure the user is logged in
async function ensureLoggedIn(page) {
    try {
        if (!(await fs.access('cookies.json').then(() => true).catch(() => false))) {
            console.log("Cookies not found, logging in...");
            await loginAndSaveCookies(page);
        } else {
            const cookies = JSON.parse(await fs.readFile('cookies.json', 'utf-8'));
            await page.setCookie(...cookies);
            await page.goto('https://www.scribd.com/', { waitUntil: 'networkidle2' });

            const isLoggedIn = await page.evaluate(() => {
                return document.querySelector('a[href="/logout"]') !== null;
            });

            if (!isLoggedIn) {
                console.log("Cookies are invalid, logging in again...");
                await loginAndSaveCookies(page);
            } else {
                console.log("Cookies are valid, proceeding...");
            }
        }
    } catch (error) {
        console.error('Error during login:', error);
        throw error;
    }
}

// Function to handle document download
async function downloadDocument(url) {
    console.log(`Navigating to URL: ${url}`);
    let page;
    try {
        if (!browser) {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
        }

        page = await browser.newPage();

        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: DOWNLOAD_DIR,
        });

        await ensureLoggedIn(page);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
        console.log(`Navigated to URL: ${url}`);

        await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for 15 seconds
        console.log('Waiting for the download button to appear...');
        await page.waitForSelector("div[class='doc_actions'] span[class='icon icon-ic_download_with_line']", { visible: true, timeout: 120000 });
        console.log('Clicking the download button...');
        await page.evaluate(() => {
            const button = document.querySelector("div[class='doc_actions'] span[class='icon icon-ic_download_with_line']");
            if (button) {
                button.click();
            } else {
                console.log('Download button not found.');
            }
        });

        await new Promise(resolve => setTimeout(resolve, 5000)); // Additional wait for the modal to appear
        console.log('Waiting for the download modal to appear...');
        await page.waitForFunction(() => {
            return document.querySelector('.wrapper__filled-button.download_selection_btn') !== null;
        }, { timeout: 120000 });
        console.log('Download modal appeared.');

        // Prevent the modal from closing
        await page.evaluate(() => {
            const modal = document.querySelector(".modal");
            if (modal) {
                const observer = new MutationObserver(() => {
                    if (modal.style.display === 'none') {
                        modal.style.display = 'block';
                    }
                });
                observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
                console.log('Modal close function overridden.');
            }
        });

        // Ensure the modal remains open
        await page.waitForSelector('.wrapper__filled-button.download_selection_btn', { visible: true, timeout: 120000 });
        console.log('Clicking the download selection button...');
        await page.click('.wrapper__filled-button.download_selection_btn');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Additional wait for the modal to appear

        // Remove request interception to allow download
        await page.setRequestInterception(false);

        // Wait for the download to complete and identify the file
        const filePath = await new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const files = await fs.readdir(DOWNLOAD_DIR);
                    const downloadedFile = files.find(file => !file.endsWith('.crdownload'));
                    if (downloadedFile) {
                        clearInterval(interval);
                        resolve(path.join(DOWNLOAD_DIR, downloadedFile));
                    }
                } catch (err) {
                    reject(err);
                }
            }, 1000);
        });

        console.log('File downloaded:', filePath);
        return filePath;

    } catch (error) {
        console.error('Error during document download:', error);
        throw error;
    } finally {
        if (page) await page.close();
    }
}

// Handle the download request (used by routes)
app.post('/:lang?/download', async (req, res) => {
    const lang = req.params.lang || 'en';
    console.log(`Received download request for language: ${lang}`);
    const { url } = req.body;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const filePath = await downloadDocument(url);

        // Detect the file type based on the file extension
        const fileExtension = path.extname(filePath).toLowerCase();
        let contentType = 'application/octet-stream';

        switch (fileExtension) {
            case '.pdf':
                contentType = 'application/pdf';
                break;
            case '.docx':
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            case '.ppt':
            case '.pptx':
                contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                break;
            case '.txt':
                contentType = 'text/plain';
                break;
            // Add more cases as needed
        }

        const fileBuffer = await fs.readFile(filePath);
        const filename = path.basename(filePath);

        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-Type', contentType);
        res.send(fileBuffer);

        // Delete the file after sending
        await fs.unlink(filePath);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
    }
});

// Schedule cleanup every hour
cron.schedule('0 * * * *', async () => {
    try {
        const files = await fs.readdir(DOWNLOAD_DIR);
        for (const file of files) {
            const filePath = path.join(DOWNLOAD_DIR, file);
            const stats = await fs.stat(filePath);
            const now = Date.now();
            const endTime = new Date(stats.ctime).getTime() + 3600000; // 1 hour

            if (now > endTime) {
                await fs.unlink(filePath);
                console.log(`File ${filePath} deleted.`);
            }
        }
    } catch (err) {
        console.error('Error during cleanup:', err);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
