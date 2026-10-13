import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
mkdirSync(resolve(root,'dist'),{recursive:true});
for(const name of ['preset','ledger']) execFileSync('pnpm',['pack','--pack-destination',resolve(root,'dist')],{cwd:resolve(root,'packages',name),stdio:'inherit'});
