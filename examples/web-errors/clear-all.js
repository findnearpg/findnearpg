#! /user/bin/env node

import fs from 'node:fs';
import fg from 'fast-glob';

const main = async () => {
  const [pages, routes] = await Promise.all([
    fg('src/app/errors/**/page.jsx'),
    fg('src/app/api/errors/**/route.js'),
  ]);
  const renamedPages = pages.map((page) => {
    const newPath = page.replace('.jsx', '.txt');
    fs.renameSync(page, newPath);
    return newPath;
  });
  const renamedRoutes = routes.map((route) => {
    const newPath = route.replace('.js', '.txt');
    fs.renameSync(route, newPath);
    return newPath;
  });
  console.log('Renamed pages:', renamedPages);
  console.log('Renamed routes:', renamedRoutes);
};
main()
  .then(() => console.log('All pages renamed successfully.'))
  .catch((error) => console.error('Error renaming pages:', error));
