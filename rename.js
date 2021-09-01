/* eslint-disable no-console */
const { readdirSync: readdir, renameSync: rename, readFileSync: read } = require('fs');
const { resolve, basename } = require('path');
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

// Get path to json
const outputDir = resolve(__dirname, 'files');
const inputFolderName = basename(path);

const outputFileName = readdir(outputDir).filter(
  (name) => name.match(inputFolderName) && name.endsWith('json'),
);

if (outputFileName.length > 1) {
  log("check your json files there's more than one matching");
  process.exit();
}
const episodeOutputs = JSON.parse(read(`${outputDir}/${outputFileName}`, 'utf-8'));

const episodeList = [];

// Makes object from output text
episodeOutputs.forEach((epi) => {
  if (!epi.downloadUrl) return;
  const name = basename(epi.downloadUrl);
  const episode = epi.episode;
  episodeList.push({ episode, name });
});

// Get an array of the files inside the folder
const dir = resolve(__dirname, path);
const episodeNameInFolder = readdir(dir);

// Renames file accroding to json file
episodeNameInFolder.forEach((name) => {
  episodeList.forEach((episode) => {
    if (episode.name == name) {
      const oldPath = `${dir}/${name}`;
      const newPath = `${dir}/${episode.episode}.mp4`;
      rename(oldPath, newPath);
    }
  });
});
log('\n___finished___\n');
