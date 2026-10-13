const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'designs.js'),'utf8'),ctx);
const entries=ctx.window.weddingDesigns;let checked=0,errors=[];
for(const d of entries){for(const file of [d.url,d.cover])if(!fs.existsSync(path.join(root,file)))errors.push(file);
const file=path.join(root,d.url),html=fs.readFileSync(file,'utf8');
for(const m of html.matchAll(/(?:src|href)="([^"#?]+)"/g)){const ref=m[1];if(/^(https?:|data:|tel:|mailto:|javascript:)/.test(ref))continue;const target=path.resolve(path.dirname(file),ref);if(!fs.existsSync(target))errors.push(`${d.id}: ${ref}`);checked++;}}
if(entries.length!==24)errors.push('Expected 24 designs');
console.log(JSON.stringify({designs:entries.length,localReferences:checked,errors},null,2));if(errors.length)process.exit(1);
