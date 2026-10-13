import { mkdirSync, copyFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const args=process.argv.slice(2), options={};
for(let i=0;i<args.length;i+=2){if(!['--harness','--home','--profile'].includes(args[i])||!args[i+1])throw Error('Use --harness <Harness source directory> --home <DSH_HOME> [--profile web]');options[args[i]]=args[i+1];}
if(!options['--harness']||!options['--home'])throw Error('Both --harness and --home are required');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),harness=resolve(options['--harness']),home=resolve(options['--home']),profile=options['--profile']??'web';
if(!/^[a-zA-Z0-9_-]+$/.test(profile))throw Error('Invalid profile name');
if(!existsSync(resolve(harness,'apps/cli/src/bin.ts')))throw Error('Not a Harness source checkout');
execFileSync(process.execPath,[resolve(root,'scripts/pack.mjs')],{stdio:'inherit'});
const backup=resolve(home,'backups','before-options-workbench-'+new Date().toISOString().replace(/[:.]/g,'-'));
mkdirSync(backup,{recursive:true,mode:0o700});
for(const name of ['package.json','pnpm-lock.yaml','cordis.yml']){const path=resolve(home,'profiles',profile,name);if(existsSync(path))copyFileSync(path,resolve(backup,name));}
const tarballs=['preset','ledger'].map(name=>{const p=JSON.parse(readFileSync(resolve(root,'packages',name,'package.json'),'utf8'));return resolve(root,'dist',p.name.replace(/^@/,'').replace('/','-')+'-'+p.version+'.tgz');});
execFileSync('pnpm',['dsh','plugin','--profile',profile,'add',...tarballs],{cwd:harness,env:{...process.env,DSH_HOME:home},stdio:'inherit'});
console.log('Installed. Existing ledger storage remains under the same DSH_HOME. Profile backup:',backup);
console.log('Start this profile from the Harness directory using your existing DSH_HOME and port. An already running host may require a restart to load package updates. This installer does not stop it.');
