'use strict';
// The legacy generator is archived. Preserve today's design in this source template.
const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, 'src', 'index.template.html');
const html = fs.readFileSync(source, 'utf8');
if (!html.includes('id="rsvp-form"') || !html.includes('src="rsvp.js"')) {
  throw new Error('RSVP markup or script missing from source template');
}
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('Built index.html from src/index.template.html');
