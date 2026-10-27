import {build} from 'esbuild';
import {mkdirSync} from 'node:fs';
mkdirSync('vendor',{recursive:true});
for(const [name,contents] of [
  ['three',"export * from 'three';"],
  ['glyphcss',"export * from 'glyphcss';"],
])await build({stdin:{contents,resolveDir:process.cwd()},bundle:true,minify:true,format:'esm',outfile:`vendor/${name}.js`,legalComments:'eof'});