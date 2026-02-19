#! /user/bin/env node

import fs from 'node:fs';
import fg from 'fast-glob';
import path from 'node:path';

const main = async () => {
  const pages = await fg('./**/index.jsx', {
    absolute: true,
  });
  const renamedPages = pages.map((page) => {
    const newPath = page.replace('examples/mobile-errors', 'apps/mobile/src/app/errors').replace('index.jsx', 'index.txt');
    fs.mkdirSync(path.dirname(newPath), { recursive: true });
    fs.renameSync(page, newPath);
    return newPath;
  });
  console.log('Renamed pages:', renamedPages);
};
main()
  .then(() => console.log('All pages renamed successfully.'))
  .catch((error) => console.error('Error renaming pages:', error));
