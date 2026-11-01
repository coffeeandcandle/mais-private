import {writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {hashPassword} from '../lock-core.js';
const password=process.argv[2];
if(!password){console.error('Usage: node scripts/set-password.js <password>   (use "--off" to remove the lock)');process.exit(1);}
let config={};
if(password!=='--off'){const salt=randomBytes(16).toString('hex'),iterations=210000;config={salt,iterations,hash:await hashPassword(password,salt,iterations)};}
await writeFile(new URL('../lock-config.js',import.meta.url),'export default '+JSON.stringify(config)+';\n');
console.log(password==='--off'?'Lock removed.':'Password set. Commit lock-config.js to apply it.');
