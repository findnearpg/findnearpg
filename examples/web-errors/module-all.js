#! /user/bin/env node

import fs from 'node:fs';
import fg from 'fast-glob';

const main = async () => {
  const [pages, routes] = await Promise.all([
    fg('src/app/errors/**/page.txt'),
    fg('src/app/errors/**/route.txt'),
  ]);
  const renamedPages = pages.map((page) => {
    const newPath = page.replace('page.txt', 'page.jsx');
    fs.renameSync(page, newPath);
    return newPath;
  });
  const renamedRoutes = routes.map((route) => {
    const newPath = route.replace('route.txt', 'route.js');
    fs.renameSync(route, newPath);
    return newPath;
  });
  console.log('Renamed pages:', renamedPages);
  console.log('Renamed routes:', renamedRoutes);
};
main()
  .then(() => console.log('All pages renamed successfully.'))
  .catch((error) => console.error('Error renaming pages:', error));
