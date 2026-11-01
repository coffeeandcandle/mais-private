import {mkdir, copyFile} from 'node:fs/promises';
const files=['index.html','app.js','budget.js','style.css','icon.svg','manifest.webmanifest'];
await mkdir(new URL('../dist/',import.meta.url),{recursive:true});
for(const file of files)await copyFile(new URL('../'+file,import.meta.url),new URL('../dist/'+file,import.meta.url));
console.log('Built static dashboard in dist/');
