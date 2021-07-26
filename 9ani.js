/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */
/* eslint-disable no-console */
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { writeFileSync: write } = require('fs');
const { execSync: exec } = require('child_process');

// sets options for browser
const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4422.0 Safari/537.36';
const browserPath = '/usr/bin/brave';
const showProcess = argv.s; // true - opens browser / false - does not open browser
const { log } = console;
const url = argv.u;
const res = argv.r;

console.clear();

if (argv.h) {
  log(
    chalk.yellow(
      `USAGE: node 9ani [options]
    [options]
      -h,     this help overview
      -u,     give episode url
      -r,     give episode number which to resume form

    example:
      node index -u https://9anime.to/watch/bleach-dub.km3v/ep-16 -r 30
      node index -u https://9anime.to/watch/bleach-dub.km3v/ep-16`,
    ),
  );
  process.exit();
}

if (typeof url === 'string') {
  log(chalk.green('working on it...\n'));
} else {
  log(chalk.bold.red('give an url using [-u]'));
  process.exit();
}

let resumeFrom;
if (typeof res === 'number' && res > 0) {
  resumeFrom = res - 1;
} else {
  resumeFrom = 0;
}

const finalUrl = [];
const animeName = url
  .split('/')
  .filter(Boolean)[3]
  .replace(/-/g, '_')
  .replace(/\..*/, '');

async function streamtape(url) {
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: !showProcess,
    args: ['--disable-dev-shm-usage'],
  });
  try {
    const [page] = await browser.pages();
    await page.setUserAgent(userAgent);

    // // closes dynamically opened tab
    if (showProcess) {
      browser.on('targetcreated', async (target) => {
        const page = await target.page();
        if (page) page.close();
      });
    }

    // blocks useless request
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (
        req.resourceType() === 'stylesheet' ||
        req.resourceType() === 'font' ||
        req.resourceType() === 'image'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // goes to 9anime to collect iframe src
    await page.goto(url);
    await page.waitForSelector('#server40');
    await page.click('#server40');
    await page.waitForTimeout(3000);
    await page.click('#server40');
    await page.waitForTimeout(3000);
    await page.click('#server40');
    await page.waitForSelector('#player > iframe');
    await page.waitForTimeout(5000);

    const pageIframe = await page.evaluate(
      () => document.querySelector('#player > iframe').src,
    );

    // goes to steamtape to collect player src
    await page.goto(pageIframe);
    await page.waitForTimeout(2000);
    await page.waitForSelector('#videolink', {
      timeout: 3000,
    });

    const videoLink = (
      await page.evaluate(() => document.querySelector('#videolink').innerText)
    ).replace(/^\/\/s/, 'https://s');

    // goes to steamtape player to collect download link
    await page.goto(videoLink);
    await page.waitForSelector('source');

    const videoDownloadLink = await page.evaluate(
      () => document.querySelector('body > video > source').src,
    );

    return videoDownloadLink;
  } catch (error) {
    log(chalk.red(`from streamtape: ${error.message}`));
  } finally {
    await browser.close();
  }
}

async function vidstream(url) {
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: !showProcess,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });
  // checks if folder exists if not create it
  const dir = path.resolve(__dirname, 'lists');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  try {
    const [page] = await browser.pages();
    await page.setUserAgent(userAgent);

    // blocks useless request
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (
        req.resourceType() === 'stylesheet' ||
        req.resourceType() === 'font' ||
        req.resourceType() === 'image'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url);
    await page.waitForSelector('#player iframe');
    await page.waitForTimeout(5000);

    log(chalk.bgBlack(`Anime to Crawl For: ${animeName}\n`));

    // finds all episode links
    const totalEpisodeUrls = await page.evaluate(() =>
      [...document.querySelectorAll('#episodes > section > div.body > ul > li > a')].map(
        (elem) => elem.href,
      ),
    );
    log(chalk.bold.yellow(`Total episode ${totalEpisodeUrls.length}\n`));
    if (resumeFrom > 0) log(chalk.yellow(`Resuming from ${res}\n`));

    // iterates over all links for downloadUrl
    for (resumeFrom; resumeFrom < totalEpisodeUrls.length; resumeFrom += 1) {
      const url = totalEpisodeUrls[resumeFrom];
      const episode = url.slice(-5).replace(/\D+/, '');
      let downloadUrl;
      let output;
      try {
        await page.goto(url);
        await page.waitForSelector('#player iframe', { timeout: 10000 });
        await page.waitForTimeout(5000);

        const elementHandle = await page.$('#player iframe');
        const frame = await elementHandle.contentFrame();
        const context = await frame.executionContext();
        output = `Episode:${episode} Url:${downloadUrl}`;
        downloadUrl = await context.evaluate(() => document.querySelector('video').src);

        const isBlob = downloadUrl.match(/^blob/);
        output = `Episode:${episode} Url:${downloadUrl}`;

        if (isBlob) {
          log(chalk.bgGray(`blob-------------episode:${episode}`));
          downloadUrl = await streamtape(url);
          output = `Episode:${episode} Url:${downloadUrl}`;
        }
      } catch (error) {
        log(chalk.red(`from vidstream loop: ${error.message}`));
      } finally {
        // writes to file
        log(output);
        finalUrl.push({ episode, episodeUrl: url, downloadUrl });
        exec(`echo '${downloadUrl}' >> ${dir}/${animeName}.txt`);
      }
    }

    log(chalk.green('\nall done________________\n'));
    browser.close();
  } catch (error) {
    log(chalk.red(`from vidstream: ${error.message}`));
  } finally {
    await browser.close();
    // writes to json
    write(`${dir}/${animeName}.json`, JSON.stringify(finalUrl));
  }
}

vidstream(url);
// streamtape(url);
