/* eslint-disable no-console */
const { readdirSync: readdir, renameSync: rename, readFileSync: read } = require('fs');
const { resolve } = require('path');
const argv = require('minimist')(process.argv.slice(2));

const path = argv.p;
const { log } = console;

if (argv.h) {
  log(
    `USAGE: node rename [options]
    [options]
      -p,     give absolute path of the downloaded folder path.

    example:
      node rename -p /home/USER/Download/bleach_dub/
      `,
  );
  process.exit();
}

if (typeof path === 'string') {
  log('working on it...\n');
} else {
  log('give path using [-p]\n\nuse -h for help\n');
  process.exit();
}

// Get path to json or text directory
const outputDir = resolve(__dirname, 'files');
const outputFileName = readdir(outputDir).filter(
  (name) => name.match(path.replace('/', '|')) && name.endsWith('json'),
);

if (outputFileName.length > 1) {
  log("check your json files there's more than one matching");
  process.exit();
}
const episodeOutputs = JSON.parse(read(`${outputDir}/${outputFileName}`, 'utf-8'));

const episodeList = [];

// Makes object from output text
episodeOutputs.forEach((epi) => {
  const preName = epi.downloadUrl.split('/').filter(Boolean);
  const name = preName[preName.length - 1];
  const episode = epi.episode;
  episodeList.push({ episode, name });
});

// Get an array of the files inside the folder
const dir = resolve(__dirname, path);
const files = readdir(dir);

// Renames file accroding to output.txt file
files.forEach((file) => {
  episodeList.forEach((episode) => {
    if (episode.name == file) {
      const oldPath = `${dir}/${file}`;
      const newPath = `${dir}/${episode.episode}.mp4`;
      rename(oldPath, newPath);
    }
  });
});
log('\n___finished___\n');
