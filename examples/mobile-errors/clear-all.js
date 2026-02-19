#! /user/bin/env node

import fs from 'node:fs';
import fg from 'fast-glob';

const main = async () => {
  const pages = await fg('../../apps/mobile/src/app/errors/**/index.{jsx,txt}', {
    absolute: true,
  });
  const renamedPages = pages.map((page) => {
    const newPath = page.replace('apps/mobile/src/app/errors/', 'examples/mobile-errors/').replace('index.txt', 'index.jsx');
    fs.mkdirSync(newPath.replace(/\/[^/]+$/, ''), { recursive: true });
    fs.renameSync(page, newPath);
    return newPath;
  });
  console.log('Renamed pages:', renamedPages);
};
main()
  .then(() => console.log('All pages renamed successfully.'))
  .catch((error) => console.error('Error renaming pages:', error));
