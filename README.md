# 9anime_scraper

This script crawls 9anime for the download links. After a successful run, it generates 2 files. 1 text file and 1 JSON file. Use the text file with any batch downloader to download all the episodes the scripts collected. Do not rename any episode that was downloaded. You can use the rename.js script to rename all the downloaded files to the original episode number

### Requirement

- node
- npm
- chrome or any chrome based browser

### How to install

1. Clone the repo.
   ` git clone https://github.com/mahedikd/9anime_scraper.git`

1. Navigate to the project directory.
   `cd 9anime_scraper`
1. Install the requirements.
   `npm install`
1. Open the `9ani.js` file and modifiy the `browserPath` variable to your browser path.

The script is now ready to run.

### How to use

use `node <script name> <options>` to run the script.

- from 9ani

```
❯ node 9ani -h
USAGE: node 9ani [options]
    [options]
      -h,     this help overview
      -u,     give episode url
      -r,     give episode number which to resume form
      -e,     give a text file which contains episodes to download[every line should contain one number]
      -s,     opens the browser to show the process

    example:
      node index -u https://9anime.to/watch/bleach-dub.km3v/ep-16 -r 30
      node index -u https://9anime.to/watch/bleach-dub.km3v/ep-16
      node index -u https://9anime.to/watch/bleach-dub.km3v/ep-16 -e epi.txt
```

- from rename.js

```
❯ node rename -h
USAGE: node rename [options]
    [options]
      -p,     give absolute path of the downloaded folder path.

    example:
      node rename -p /home/USER/Download/bleach_dub/
```

#### Note

The output of the `9ani` script can be found in **files** folder. It is created in the scripts folder. Use those file names to rename the downloaded episodes folder before running the `rename` script.

ex. if the output looks like naruto_dub.txt, rename your downloaded video folder to naruto_dub.
