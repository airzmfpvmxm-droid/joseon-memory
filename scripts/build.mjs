import fs from 'node:fs';
fs.mkdirSync('dist',{recursive:true});
for(const name of ['index.html','js','css','assets'])fs.cpSync(name,`dist/${name}`,{recursive:true});
console.log('Built static game in dist/');
