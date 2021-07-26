/* eslint-disable no-console */
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { writeFileSync: write } = require('fs');
const { execSync: exec } = require('child_process');

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4422.0 Safari/537.36';
const log = console.log;
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

async function steamTamefoVidstrm(url) {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/brave',
    });
    const [page] = await browser.pages();
    await page.setUserAgent(userAgent);
    await page.setDefaultNavigationTimeout(0);

    // goes to 9anime to collect iframe src
    await page.goto(url);
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#episodes');
    await page.click('#server40');
    await page.click('#server40');
    await page.click('#server40');
    await page.waitForTimeout(5000);
    await page.waitForSelector('#player > iframe');

    const pageIframe = await page.evaluate(
      () => document.querySelector('#player > iframe').src,
    );

    // goes to steamtape to collect player src
    await page.goto(pageIframe);
    await page.waitForSelector('#videolink');

    const videoLink = (
      await page.evaluate(() => document.querySelector('#videolink').innerText)
    ).replace(/^\/\/s/, 'https://s');

    // goes to steamtape player to collect download link
    await page.goto(videoLink);
    await page.waitForSelector('source');

    const videoDownloadLink = await page.evaluate(
      () => document.querySelector('body > video > source').src,
    );
    log(videoDownloadLink);
    browser.close();

    return videoDownloadLink;
  } catch (error) {
    log(error);
  }
}

async function vidstrm(url) {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/brave',
      // headless: false,
      args: [
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });
    const [page] = await browser.pages();
    await page.setUserAgent(userAgent);
    await page.setDefaultNavigationTimeout(0);

    await page.goto(url);
    await page.waitForTimeout(5000);
    await page.waitForSelector('#player iframe');

    log(chalk.bgBlack(`Anime to Crawl For: ${animeName}\n`));

    // finds all episode links
    const totalEpisodeUrls = await page.evaluate(() =>
      [...document.querySelectorAll('#episodes > section > div.body > ul > li > a')].map(
        (elem) => elem.href,
      ),
    );
    log(chalk.bold.yellow(`total episode ${totalEpisodeUrls.length}\n`));

    // checks if folder exists if not create it
    const dir = path.resolve(__dirname, 'lists');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    // iterates over all links for downloadUrl
    for (resumeFrom; resumeFrom < totalEpisodeUrls.length; resumeFrom += 1) {
      try {
        const url = totalEpisodeUrls[resumeFrom];
        const episode = url.slice(-5).replace(/\D+/, '');

        await page.goto(url);
        await page.waitForTimeout(5000);
        await page.waitForSelector('#player iframe');

        const elementHandle = await page.$('#player iframe');
        const frame = await elementHandle.contentFrame();
        const context = await frame.executionContext();
        await page.waitForTimeout(2000);
        let downloadUrl = await context.evaluate(
          () => document.querySelector('video').src,
        );

        const output = `episode:${episode} url:${downloadUrl}`;
        const isBlob = downloadUrl.match(/^blob/);

        if (isBlob) {
          log(chalk.bgGray(`blob-------------episode:${episode}`));
          downloadUrl = await steamTamefoVidstrm(url);
          log(chalk.grey('-------------------------'));
        } else {
          log(output);
        }

        // writes to file
        exec(`echo '${output}' >> ${dir}/${animeName}.txt`);

        finalUrl.push({ episode, episodeUrl: url, downloadUrl });
      } catch (error) {
        log(chalk.red(error.message));
      }
    }
    // writes to json
    write(`${dir}/${animeName}.json`, JSON.stringify(finalUrl));

    log(chalk.green('\nall done________________\n'));
    browser.close();

    return;
  } catch (error) {
    log(chalk.red(error.message));
  }
}

vidstrm(url);
