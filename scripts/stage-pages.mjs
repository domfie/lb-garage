// Keep the existing main/(root) GitHub Pages configuration deployable as well as Actions.
// src/index.html is the editable source; root/index.html and assets/ are build output.
import { cp, copyFile, writeFile } from 'node:fs/promises';
// Retain old hashed bundles so an already-open browser survives the next deploy.
await cp('dist/assets', 'assets', { recursive: true });
await copyFile('dist/index.html', 'index.html');
await copyFile('dist/favicon.svg', 'favicon.svg');
await writeFile('.nojekyll', '');
await writeFile('dist/.nojekyll', '');
console.log('Staged production build for existing main/(root) GitHub Pages.');
