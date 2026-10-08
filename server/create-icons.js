import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// A simple 192x192 and 512x512 SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f43f5e;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#ec4899;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#f43f5e" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#grad)" />
  <g filter="url(#shadow)">
    <!-- Chat bubble -->
    <path d="M120 160 C120 120, 150 90, 200 90 L312 90 C362 90, 392 120, 392 160 L392 270 C392 310, 362 340, 312 340 L210 340 L140 400 L155 340 L200 340 C150 340, 120 310, 120 270 Z" fill="#ffffff" />
    <!-- Heart in bubble -->
    <path d="M256 260 C256 260, 200 220, 200 175 C200 150, 220 135, 240 135 C250 135, 256 142, 256 142 C256 142, 262 135, 272 135 C292 135, 312 150, 312 175 C312 220, 256 260, 256 260 Z" fill="#f43f5e" />
  </g>
</svg>`;

const pubDir = path.join(__dirname, '..', 'client', 'public');
fs.writeFileSync(path.join(pubDir, 'icon.svg'), svgContent, 'utf-8');
console.log('SVG icon written');
