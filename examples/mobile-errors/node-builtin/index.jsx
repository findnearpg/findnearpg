import fs from 'node:fs';
export default function Page() {
  const filePath = './missing.js';
  console.log('filePath:', filePath);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return 'File not found';
}
