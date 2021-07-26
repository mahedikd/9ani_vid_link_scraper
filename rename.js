/* eslint-disable no-console */
const { readdirSync, rename, readFileSync: read } = require('fs');
const { resolve } = require('path');
const argv = require('minimist')(process.argv.slice(2));

const path = argv.p;
const log = console.log;

if (typeof path === 'string') {
  log('working on it...\n');
} else {
  log('give an path using [-p]');
  process.exit();
}

// Get path to json or text directory
const outputDir = resolve(__dirname, 'lists');
const outputFileName = readdirSync(outputDir).filter(
  (name) => path.match(name.replace(/\s+/, '|')) && name.endsWith('txt'),
)[0];

const episodeOutputs = read(`${outputDir}/${outputFileName}`, 'utf-8')
  .split('\n')
  .filter(Boolean);

const episodeList = [];

// Makes object from output text
episodeOutputs.forEach((line) => {
  const array = line.split(/\s+|\/|:/);
  const episode = array[1];
  const name = array[array.length - 1];
  episodeList.push({ episode, name });
});

// Get an array of the files inside the folder
const dir = resolve(__dirname, path);
const files = readdirSync(dir);

// Renames file accroding to output.txt file
files.forEach((file) => {
  episodeList.forEach((episode) => {
    if (episode.name == file) {
      const oldPath = `${dir}/${file}`;
      const newPath = `${dir}/${episode.episode}.mp4`;
      rename(oldPath, newPath, (err) => log(err));
    }
  });
});

console.log('finished');
